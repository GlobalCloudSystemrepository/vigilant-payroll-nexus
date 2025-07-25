
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar as CalendarIcon, 
  Users, 
  UserCheck, 
  UserX, 
  TrendingUp,
  Filter,
  Download
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, eachWeekOfInterval } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AttendanceReportData {
  date: string;
  customer_id: string;
  customer_name: string;
  scheduled_count: number;
  present_count: number;
  absent_count: number;
  relief_count: number;
  attendance_rate: number;
}

interface CustomerSummary {
  customer_id: string;
  customer_name: string;
  total_scheduled: number;
  total_present: number;
  total_absent: number;
  total_relief: number;
  overall_rate: number;
}

export default function AttendanceReport() {
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
  const [viewType, setViewType] = useState<'day' | 'week'>('day');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
  const [reportData, setReportData] = useState<AttendanceReportData[]>([]);
  const [customerSummaries, setCustomerSummaries] = useState<CustomerSummary[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchReportData();
    }
  }, [startDate, endDate, viewType, selectedCustomer]);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, company_name')
        .eq('status', 'active')
        .order('company_name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchReportData = async () => {
    if (!startDate || !endDate) return;
    
    setIsLoading(true);
    try {
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');

      // Fetch schedules for the date range
      const { data: schedules, error: schedulesError } = await supabase
        .from('schedules')
        .select(`
          *,
          customers!schedules_customer_id_fkey(id, company_name),
          employees!schedules_employee_id_fkey(id, name)
        `)
        .gte('shift_date', startDateStr)
        .lte('shift_date', endDateStr)
        .eq('status', 'scheduled');

      if (schedulesError) throw schedulesError;

      // Fetch attendance for the date range
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          *,
          schedules!attendance_schedule_id_fkey(
            customer_id,
            customers!schedules_customer_id_fkey(company_name)
          )
        `)
        .gte('date', startDateStr)
        .lte('date', endDateStr);

      if (attendanceError) throw attendanceError;

      // Process the data
      const processedData = processAttendanceData(schedules || [], attendance || []);
      
      // Filter by customer if selected
      const filteredData = selectedCustomer === 'all' 
        ? processedData 
        : processedData.filter(d => d.customer_id === selectedCustomer);

      setReportData(filteredData);
      calculateCustomerSummaries(filteredData);

    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch report data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processAttendanceData = (schedules: any[], attendance: any[]): AttendanceReportData[] => {
    const dateRange = viewType === 'day' 
      ? eachDayOfInterval({ start: startDate, end: endDate })
      : eachWeekOfInterval({ start: startDate, end: endDate });

    const reportMap = new Map<string, AttendanceReportData>();

    // Initialize report data structure
    dateRange.forEach(date => {
      const dateKey = viewType === 'day' 
        ? format(date, 'yyyy-MM-dd')
        : format(startOfWeek(date), 'yyyy-MM-dd');
        
      customers.forEach(customer => {
        const key = `${dateKey}_${customer.id}`;
        reportMap.set(key, {
          date: dateKey,
          customer_id: customer.id,
          customer_name: customer.company_name,
          scheduled_count: 0,
          present_count: 0,
          absent_count: 0,
          relief_count: 0,
          attendance_rate: 0
        });
      });
    });

    // Count scheduled employees
    schedules.forEach(schedule => {
      const scheduleDate = viewType === 'day' 
        ? schedule.shift_date
        : format(startOfWeek(new Date(schedule.shift_date)), 'yyyy-MM-dd');
      
      const key = `${scheduleDate}_${schedule.customer_id}`;
      const report = reportMap.get(key);
      if (report) {
        report.scheduled_count++;
      }
    });

    // Count attendance and relief workers
    attendance.forEach(att => {
      const attDate = viewType === 'day' 
        ? att.date
        : format(startOfWeek(new Date(att.date)), 'yyyy-MM-dd');
      
      const customerId = att.schedules?.customer_id;
      if (!customerId) return;
      
      const key = `${attDate}_${customerId}`;
      const report = reportMap.get(key);
      if (report) {
        if (att.status === 'present') {
          report.present_count++;
        } else if (att.status === 'absent') {
          report.absent_count++;
          
          // Count relief workers
          if (att.replacement_type === 'vendor' || att.replacement_type === 'employee') {
            report.relief_count++;
          }
        }
      }
    });

    // Calculate attendance rates
    reportMap.forEach(report => {
      if (report.scheduled_count > 0) {
        report.attendance_rate = Math.round(
          ((report.present_count + report.relief_count) / report.scheduled_count) * 100
        );
      }
    });

    return Array.from(reportMap.values())
      .filter(report => report.scheduled_count > 0)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.customer_name.localeCompare(b.customer_name);
      });
  };

  const calculateCustomerSummaries = (data: AttendanceReportData[]) => {
    const summaryMap = new Map<string, CustomerSummary>();

    data.forEach(report => {
      if (!summaryMap.has(report.customer_id)) {
        summaryMap.set(report.customer_id, {
          customer_id: report.customer_id,
          customer_name: report.customer_name,
          total_scheduled: 0,
          total_present: 0,
          total_absent: 0,
          total_relief: 0,
          overall_rate: 0
        });
      }

      const summary = summaryMap.get(report.customer_id)!;
      summary.total_scheduled += report.scheduled_count;
      summary.total_present += report.present_count;
      summary.total_absent += report.absent_count;
      summary.total_relief += report.relief_count;
    });

    // Calculate overall rates
    summaryMap.forEach(summary => {
      if (summary.total_scheduled > 0) {
        summary.overall_rate = Math.round(
          ((summary.total_present + summary.total_relief) / summary.total_scheduled) * 100
        );
      }
    });

    setCustomerSummaries(Array.from(summaryMap.values()));
  };

  const getStatusColor = (rate: number) => {
    if (rate >= 90) return "bg-business-success text-white";
    if (rate >= 70) return "bg-business-warning text-white";
    return "bg-destructive text-white";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Attendance Report</h2>
          <p className="text-muted-foreground">Scheduled vs Present analysis by customer</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : 'Pick start date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : 'Pick end date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* View Type */}
            <div>
              <label className="block text-sm font-medium mb-2">View By</label>
              <Select value={viewType} onValueChange={(value: 'day' | 'week') => setViewType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select view type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Daily</SelectItem>
                  <SelectItem value="week">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Customer Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Customer</label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger>
                  <SelectValue placeholder="All customers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Apply Button */}
            <div className="flex items-end">
              <Button 
                onClick={fetchReportData}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Loading...' : 'Apply Filters'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      <Tabs defaultValue="detailed" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="detailed">Detailed Report</TabsTrigger>
          <TabsTrigger value="summary">Customer Summary</TabsTrigger>
        </TabsList>

        {/* Detailed Report */}
        <TabsContent value="detailed">
          <Card>
            <CardHeader>
              <CardTitle>
                {viewType === 'day' ? 'Daily' : 'Weekly'} Attendance Report
              </CardTitle>
              <CardDescription>
                Scheduled vs Present by customer for {format(startDate, 'PPP')} to {format(endDate, 'PPP')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading report data...</div>
              ) : reportData.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-center">Scheduled</TableHead>
                        <TableHead className="text-center">Present</TableHead>
                        <TableHead className="text-center">Absent</TableHead>
                        <TableHead className="text-center">Relief Workers</TableHead>
                        <TableHead className="text-center">Attendance Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.map((report, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {format(new Date(report.date), viewType === 'day' ? 'MMM dd, yyyy' : 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>{report.customer_name}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="flex items-center justify-center gap-1">
                              <Users className="h-3 w-3" />
                              {report.scheduled_count}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-business-success text-white flex items-center justify-center gap-1">
                              <UserCheck className="h-3 w-3" />
                              {report.present_count}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-destructive text-white flex items-center justify-center gap-1">
                              <UserX className="h-3 w-3" />
                              {report.absent_count}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-business-blue text-white flex items-center justify-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {report.relief_count}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={getStatusColor(report.attendance_rate)}>
                              {report.attendance_rate}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No data available for the selected date range and filters
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Summary Report */}
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Customer Summary</CardTitle>
              <CardDescription>
                Overall performance summary by customer
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customerSummaries.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customerSummaries.map((summary) => (
                    <Card key={summary.customer_id}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{summary.customer_name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Total Scheduled</span>
                            <Badge variant="outline">{summary.total_scheduled}</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Total Present</span>
                            <Badge className="bg-business-success text-white">{summary.total_present}</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Total Absent</span>
                            <Badge className="bg-destructive text-white">{summary.total_absent}</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Relief Workers</span>
                            <Badge className="bg-business-blue text-white">{summary.total_relief}</Badge>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t">
                            <span className="text-sm font-medium">Overall Rate</span>
                            <Badge className={getStatusColor(summary.overall_rate)}>
                              {summary.overall_rate}%
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No summary data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

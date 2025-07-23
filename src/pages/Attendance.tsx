import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  UserCheck, UserX, Clock, MapPin, 
  CheckCircle, XCircle, AlertTriangle, Edit
} from "lucide-react";
import AttendanceMarkDialog from "@/components/attendance/AttendanceMarkDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

interface AttendanceRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  customer_name: string;
  location: string;
  checkIn: string;
  checkOut: string;
  status: string;
  hours: string;
  date: string;
  schedule_id: string;
  replacement_type?: string;
  replacement_vendor_name?: string;
  replacement_employee_name?: string;
  replacement_notes?: string;
  is_overtime?: boolean;
}

interface AttendanceStats {
  present: number;
  late: number;
  absent: number;
  rate: number;
}

export default function Attendance() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<AttendanceStats>({
    present: 0,
    late: 0,
    absent: 0,
    rate: 0
  });
  const [monthlyStats, setMonthlyStats] = useState<AttendanceStats>({
    present: 0,
    late: 0,
    absent: 0,
    rate: 0
  });
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    present: 0,
    late: 0,
    absent: 0,
    rate: 0
  });
  const [markDialogOpen, setMarkDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedDate) {
      fetchAttendanceData();
      fetchWeeklyStats();
      fetchMonthlyStats();
    }
  }, [selectedDate]);

  const fetchAttendanceData = async () => {
    if (!selectedDate) return;
    
    setIsLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      // Fetch attendance records with comprehensive data including replacement info
      const { data: attendance, error } = await supabase
        .from('attendance')
        .select(`
          *,
          employees!attendance_employee_id_fkey(name),
          schedules!attendance_schedule_id_fkey(
            location,
            customers!schedules_customer_id_fkey(company_name)
          ),
          replacement_vendor:vendors!attendance_replacement_vendor_id_fkey(company_name),
          replacement_employee:employees!attendance_replacement_employee_id_fkey(name)
        `)
        .eq('date', dateStr);

      if (error) {
        console.error('Error fetching attendance:', error);
        // Try fallback query without foreign key relationships
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('attendance')
          .select('*')
          .eq('date', dateStr);
        
        if (fallbackError) throw fallbackError;
        
        const formattedFallback = fallbackData?.map(record => ({
          id: record.id,
          employee_id: record.employee_id,
          employee_name: 'Loading...',
          customer_name: 'Loading...',
          location: 'Loading...',
          checkIn: record.check_in_time ? 
            new Date(record.check_in_time).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }) : '-',
          checkOut: record.check_out_time ? 
            new Date(record.check_out_time).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }) : '-',
          status: record.status,
          hours: record.hours_worked ? `${record.hours_worked}h` : '0h',
          date: record.date,
          schedule_id: record.schedule_id || '',
          replacement_type: record.replacement_type,
          replacement_notes: record.replacement_notes,
          is_overtime: record.is_overtime
        })) || [];
        
        setAttendanceRecords(formattedFallback);
        calculateStats(formattedFallback);
        return;
      }

      // Format the data with proper relationships including replacement info
      const formattedRecords: AttendanceRecord[] = attendance?.map(record => ({
        id: record.id,
        employee_id: record.employee_id,
        employee_name: record.employees?.name || 'Unknown Employee',
        customer_name: record.schedules?.customers?.company_name || 'Unknown Customer',
        location: record.schedules?.location || 'No location',
        checkIn: record.check_in_time ? 
          new Date(record.check_in_time).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }) : '-',
        checkOut: record.check_out_time ? 
          new Date(record.check_out_time).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }) : '-',
        status: record.status,
        hours: record.hours_worked ? `${record.hours_worked}h` : '0h',
        date: record.date,
        schedule_id: record.schedule_id || '',
        replacement_type: record.replacement_type,
        replacement_vendor_name: record.replacement_vendor?.company_name,
        replacement_employee_name: record.replacement_employee?.name,
        replacement_notes: record.replacement_notes,
        is_overtime: record.is_overtime
      })) || [];

      setAttendanceRecords(formattedRecords);
      calculateStats(formattedRecords);

    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch attendance data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (records: AttendanceRecord[]) => {
    const present = records.filter(r => r.status === 'present').length;
    const late = records.filter(r => r.status === 'late').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const total = present + late + absent;
    const rate = total > 0 ? ((present + late) / total) * 100 : 0;

    setAttendanceStats({
      present,
      late,
      absent,
      rate: Math.round(rate * 10) / 10
    });
  };

  const fetchWeeklyStats = async () => {
    if (!selectedDate) return;
    
    try {
      const weekStart = format(startOfWeek(selectedDate), 'yyyy-MM-dd');
      const weekEnd = format(endOfWeek(selectedDate), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('attendance')
        .select('status')
        .gte('date', weekStart)
        .lte('date', weekEnd);

      if (error) throw error;

      const present = data?.filter(r => r.status === 'present').length || 0;
      const late = data?.filter(r => r.status === 'late').length || 0;
      const absent = data?.filter(r => r.status === 'absent').length || 0;
      const total = present + late + absent;
      const rate = total > 0 ? ((present + late) / total) * 100 : 0;

      setWeeklyStats({
        present,
        late,
        absent,
        rate: Math.round(rate * 10) / 10
      });
    } catch (error) {
      console.error('Error fetching weekly stats:', error);
    }
  };

  const fetchMonthlyStats = async () => {
    if (!selectedDate) return;
    
    try {
      const monthStart = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(selectedDate), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('attendance')
        .select('status')
        .gte('date', monthStart)
        .lte('date', monthEnd);

      if (error) throw error;

      const present = data?.filter(r => r.status === 'present').length || 0;
      const late = data?.filter(r => r.status === 'late').length || 0;
      const absent = data?.filter(r => r.status === 'absent').length || 0;
      const total = present + late + absent;
      const rate = total > 0 ? ((present + late) / total) * 100 : 0;

      setMonthlyStats({
        present,
        late,
        absent,
        rate: Math.round(rate * 10) / 10
      });
    } catch (error) {
      console.error('Error fetching monthly stats:', error);
    }
  };

  const handleEditAttendance = (record: AttendanceRecord) => {
    // Convert the record to match the expected format for editing
    const editRecord = {
      id: record.id,
      employee_id: record.employee_id,
      date: record.date,
      status: record.status,
      check_in_time: record.checkIn !== '-' ? `${record.date}T${record.checkIn}:00` : undefined,
      check_out_time: record.checkOut !== '-' ? `${record.date}T${record.checkOut}:00` : undefined,
      notes: '',
      replacement_type: record.replacement_type,
      replacement_vendor_id: '',
      replacement_employee_id: '',
      replacement_notes: record.replacement_notes,
      is_overtime: record.is_overtime,
      schedule_id: record.schedule_id
    };
    
    setEditingRecord(editRecord);
    setEditDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present": return <CheckCircle className="h-4 w-4 text-business-success" />;
      case "late": return <AlertTriangle className="h-4 w-4 text-business-warning" />;
      case "absent": return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present": return "bg-business-success text-white";
      case "late": return "bg-business-warning text-white";
      case "absent": return "bg-destructive text-white";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Attendance Management</h1>
          <p className="text-muted-foreground">Track daily attendance and working hours</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setBulkDialogOpen(true)}>
            <UserCheck className="h-4 w-4 mr-2" />
            Bulk Check-in
          </Button>
          <Button className="bg-gradient-to-r from-primary to-primary-hover" onClick={() => setMarkDialogOpen(true)}>
            <UserX className="h-4 w-4 mr-2" />
            Mark Attendance
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-business-success" />
              <div>
                <div className="text-2xl font-bold text-business-success">{attendanceStats.present}</div>
                <p className="text-sm text-muted-foreground">Present Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-business-warning" />
              <div>
                <div className="text-2xl font-bold text-business-warning">{attendanceStats.late}</div>
                <p className="text-sm text-muted-foreground">Late Arrivals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <div>
                <div className="text-2xl font-bold text-destructive">{attendanceStats.absent}</div>
                <p className="text-sm text-muted-foreground">Absent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold text-primary">{attendanceStats.rate}%</div>
                <p className="text-sm text-muted-foreground">Attendance Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Full Width */}
      <div>
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="weekly">This Week</TabsTrigger>
            <TabsTrigger value="monthly">This Month</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Records</CardTitle>
                <CardDescription>
                  {selectedDate?.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="text-muted-foreground">Loading attendance records...</div>
                  </div>
                ) : attendanceRecords.length > 0 ? (
                  <div className="space-y-4">
                    {attendanceRecords.map((record) => (
                      <div 
                        key={record.id}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            {getStatusIcon(record.status)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground">{record.employee_name}</h3>
                            <p className="text-sm text-muted-foreground">{record.employee_id}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {record.customer_name} - {record.location}
                              </span>
                            </div>
                            
                            {/* Show replacement information for absent employees */}
                            {record.status === 'absent' && record.replacement_type && (
                              <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                                <div className="flex items-center gap-1">
                                  <UserX className="h-3 w-3 text-destructive" />
                                  <span className="font-medium text-destructive">
                                    Replaced by {record.replacement_type === 'vendor' ? 'Vendor' : 'Employee'}:
                                  </span>
                                </div>
                                <div className="text-muted-foreground">
                                  {record.replacement_type === 'vendor' ? record.replacement_vendor_name : record.replacement_employee_name}
                                  {record.replacement_type === 'employee' && record.is_overtime && (
                                    <span className="ml-2 text-business-warning">(Overtime)</span>
                                  )}
                                </div>
                                {record.replacement_notes && (
                                  <div className="text-muted-foreground mt-1">
                                    Note: {record.replacement_notes}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="flex gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Check In</p>
                                <p className="font-medium">{record.checkIn}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Check Out</p>
                                <p className="font-medium">{record.checkOut}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Hours</p>
                                <p className="font-medium">{record.hours}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={getStatusColor(record.status)}>
                              {record.status}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditAttendance(record)}
                              className="text-xs"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No attendance records found for this date
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="weekly">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Overview</CardTitle>
                <CardDescription>Attendance summary for this week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-business-success/10 rounded-lg">
                    <div className="text-2xl font-bold text-business-success">{weeklyStats.present}</div>
                    <p className="text-sm text-muted-foreground">Present</p>
                  </div>
                  <div className="text-center p-4 bg-business-warning/10 rounded-lg">
                    <div className="text-2xl font-bold text-business-warning">{weeklyStats.late}</div>
                    <p className="text-sm text-muted-foreground">Late</p>
                  </div>
                  <div className="text-center p-4 bg-destructive/10 rounded-lg">
                    <div className="text-2xl font-bold text-destructive">{weeklyStats.absent}</div>
                    <p className="text-sm text-muted-foreground">Absent</p>
                  </div>
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{weeklyStats.rate}%</div>
                    <p className="text-sm text-muted-foreground">Attendance Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monthly">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Overview</CardTitle>
                <CardDescription>Attendance summary for this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-business-success/10 rounded-lg">
                    <div className="text-2xl font-bold text-business-success">{monthlyStats.present}</div>
                    <p className="text-sm text-muted-foreground">Present</p>
                  </div>
                  <div className="text-center p-4 bg-business-warning/10 rounded-lg">
                    <div className="text-2xl font-bold text-business-warning">{monthlyStats.late}</div>
                    <p className="text-sm text-muted-foreground">Late</p>
                  </div>
                  <div className="text-center p-4 bg-destructive/10 rounded-lg">
                    <div className="text-2xl font-bold text-destructive">{monthlyStats.absent}</div>
                    <p className="text-sm text-muted-foreground">Absent</p>
                  </div>
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{monthlyStats.rate}%</div>
                    <p className="text-sm text-muted-foreground">Attendance Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <AttendanceMarkDialog 
        open={markDialogOpen} 
        onOpenChange={setMarkDialogOpen}
        onAttendanceMarked={fetchAttendanceData}
      />
      <AttendanceMarkDialog 
        open={bulkDialogOpen} 
        onOpenChange={setBulkDialogOpen}
        isBulk={true}
        onAttendanceMarked={fetchAttendanceData}
      />
      <AttendanceMarkDialog 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen}
        editRecord={editingRecord}
        onAttendanceMarked={fetchAttendanceData}
      />
    </div>
  );
}

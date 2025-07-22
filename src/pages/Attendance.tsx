
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  UserCheck, UserX, Clock, MapPin, 
  CheckCircle, XCircle, AlertTriangle 
} from "lucide-react";
import AttendanceMarkDialog from "@/components/attendance/AttendanceMarkDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    present: 0,
    late: 0,
    absent: 0,
    rate: 0
  });
  const [markDialogOpen, setMarkDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedDate) {
      fetchAttendanceData();
    }
  }, [selectedDate]);

  const fetchAttendanceData = async () => {
    if (!selectedDate) return;
    
    setIsLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      // Fetch attendance records with employee and schedule info
      const { data: attendance, error } = await supabase
        .from('attendance')
        .select(`
          *,
          employees!inner(name),
          schedules!inner(
            customer_id,
            location,
            customers(company_name)
          )
        `)
        .eq('date', dateStr);

      if (error) throw error;

      // Format the data
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
        date: record.date
      })) || [];

      setAttendanceRecords(formattedRecords);

      // Calculate stats
      const present = formattedRecords.filter(r => r.status === 'present').length;
      const late = formattedRecords.filter(r => r.status === 'late').length;
      const absent = formattedRecords.filter(r => r.status === 'absent').length;
      const total = present + late + absent;
      const rate = total > 0 ? ((present + late) / total) * 100 : 0;

      setAttendanceStats({
        present,
        late,
        absent,
        rate: Math.round(rate * 10) / 10
      });

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

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Calendar</CardTitle>
            <CardDescription>Select date to view attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Today's Attendance */}
        <div className="lg:col-span-2">
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
                            <div>
                              <h3 className="font-semibold text-foreground">{record.employee_name}</h3>
                              <p className="text-sm text-muted-foreground">{record.employee_id}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {record.customer_name} - {record.location}
                                </span>
                              </div>
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
                            <Badge className={getStatusColor(record.status)}>
                              {record.status}
                            </Badge>
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
                  <p className="text-muted-foreground">Weekly attendance analytics will be displayed here.</p>
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
                  <p className="text-muted-foreground">Monthly attendance analytics will be displayed here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialogs */}
      <AttendanceMarkDialog 
        open={markDialogOpen} 
        onOpenChange={setMarkDialogOpen}
      />
      <AttendanceMarkDialog 
        open={bulkDialogOpen} 
        onOpenChange={setBulkDialogOpen}
        isBulk={true}
      />
    </div>
  );
}

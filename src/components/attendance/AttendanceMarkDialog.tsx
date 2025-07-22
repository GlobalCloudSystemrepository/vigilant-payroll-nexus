
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ScheduledEmployee {
  id: string;
  employee_id: string;
  employee_name: string;
  customer_name: string;
  location: string;
  start_time: string;
  end_time: string;
  shift_date: string;
  attendance_status?: string;
}

interface AttendanceMarkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isBulk?: boolean;
}

export default function AttendanceMarkDialog({ open, onOpenChange, isBulk = false }: AttendanceMarkDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [scheduledEmployees, setScheduledEmployees] = useState<ScheduledEmployee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [attendanceData, setAttendanceData] = useState<Record<string, {
    status: string;
    checkIn: string;
    checkOut: string;
    notes: string;
  }>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && selectedDate) {
      fetchScheduledEmployees();
    }
  }, [open, selectedDate]);

  const fetchScheduledEmployees = async () => {
    setIsLoading(true);
    try {
      const { data: schedules, error } = await supabase
        .from('schedules')
        .select(`
          id,
          employee_id,
          customer_id,
          shift_date,
          start_time,
          end_time,
          location,
          employees!inner(name),
          customers(company_name)
        `)
        .eq('shift_date', format(selectedDate, 'yyyy-MM-dd'))
        .eq('status', 'scheduled');

      if (error) throw error;

      const formattedEmployees = schedules?.map(schedule => ({
        id: schedule.id,
        employee_id: schedule.employee_id,
        employee_name: schedule.employees?.name || 'Unknown Employee',
        customer_name: schedule.customers?.company_name || 'Unknown Customer',
        location: schedule.location || 'No location specified',
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        shift_date: schedule.shift_date
      })) || [];

      setScheduledEmployees(formattedEmployees);

      // Check existing attendance
      if (formattedEmployees.length > 0) {
        const employeeIds = formattedEmployees.map(emp => emp.employee_id);
        const { data: attendance } = await supabase
          .from('attendance')
          .select('*')
          .in('employee_id', employeeIds)
          .eq('date', format(selectedDate, 'yyyy-MM-dd'));

        const attendanceMap: Record<string, any> = {};
        attendance?.forEach(att => {
          attendanceMap[att.employee_id] = {
            status: att.status,
            checkIn: att.check_in_time ? format(new Date(att.check_in_time), 'HH:mm') : '',
            checkOut: att.check_out_time ? format(new Date(att.check_out_time), 'HH:mm') : '',
            notes: att.notes || ''
          };
        });
        setAttendanceData(attendanceMap);
      }
    } catch (error) {
      console.error('Error fetching scheduled employees:', error);
      toast({
        title: "Error",
        description: "Failed to fetch scheduled employees",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateAttendance = (employeeId: string, field: string, value: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [field]: value
      }
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const employeesToProcess = isBulk 
        ? scheduledEmployees 
        : scheduledEmployees.filter(emp => emp.employee_id === selectedEmployee);

      for (const employee of employeesToProcess) {
        const attendance = attendanceData[employee.employee_id];
        if (!attendance?.status) continue;

        const attendanceRecord = {
          employee_id: employee.employee_id,
          date: format(selectedDate, 'yyyy-MM-dd'),
          status: attendance.status,
          check_in_time: attendance.checkIn ? 
            new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${attendance.checkIn}:00`).toISOString() : null,
          check_out_time: attendance.checkOut ? 
            new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${attendance.checkOut}:00`).toISOString() : null,
          notes: attendance.notes || null,
          hours_worked: attendance.checkIn && attendance.checkOut ? 
            calculateHoursWorked(attendance.checkIn, attendance.checkOut) : null
        };

        const { error } = await supabase
          .from('attendance')
          .upsert(attendanceRecord, {
            onConflict: 'employee_id,date'
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Attendance ${isBulk ? 'bulk' : ''} marked successfully`,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast({
        title: "Error",
        description: "Failed to mark attendance",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateHoursWorked = (checkIn: string, checkOut: string): number => {
    const start = new Date(`2000-01-01T${checkIn}:00`);
    const end = new Date(`2000-01-01T${checkOut}:00`);
    const diffMs = end.getTime() - start.getTime();
    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isBulk ? "Bulk Check-in" : "Mark Attendance"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Selection */}
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">Select Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Employee Selection (for single attendance) */}
          {!isBulk && (
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">Select Employee</label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose an employee..." />
                </SelectTrigger>
                <SelectContent>
                  {scheduledEmployees.map((employee) => (
                    <SelectItem key={employee.employee_id} value={employee.employee_id}>
                      {employee.employee_name} - {employee.customer_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Scheduled Employees */}
          {scheduledEmployees.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Scheduled Employees ({scheduledEmployees.length})
              </h3>
              
              {(isBulk ? scheduledEmployees : scheduledEmployees.filter(emp => emp.employee_id === selectedEmployee)).map((employee) => (
                <div key={employee.employee_id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{employee.employee_name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {employee.customer_name} - {employee.location}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {employee.start_time} - {employee.end_time}
                        </span>
                      </div>
                    </div>
                    
                    {attendanceData[employee.employee_id]?.status && (
                      <Badge className={getStatusColor(attendanceData[employee.employee_id].status)}>
                        {attendanceData[employee.employee_id].status}
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <Select 
                        value={attendanceData[employee.employee_id]?.status || ""} 
                        onValueChange={(value) => updateAttendance(employee.employee_id, 'status', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="present">Present</SelectItem>
                          <SelectItem value="late">Late</SelectItem>
                          <SelectItem value="absent">Absent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Check In</label>
                      <input
                        type="time"
                        className="w-full px-3 py-2 border border-input rounded-md"
                        value={attendanceData[employee.employee_id]?.checkIn || ""}
                        onChange={(e) => updateAttendance(employee.employee_id, 'checkIn', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Check Out</label>
                      <input
                        type="time"
                        className="w-full px-3 py-2 border border-input rounded-md"
                        value={attendanceData[employee.employee_id]?.checkOut || ""}
                        onChange={(e) => updateAttendance(employee.employee_id, 'checkOut', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Notes</label>
                      <input
                        type="text"
                        placeholder="Optional notes"
                        className="w-full px-3 py-2 border border-input rounded-md"
                        value={attendanceData[employee.employee_id]?.notes || ""}
                        onChange={(e) => updateAttendance(employee.employee_id, 'notes', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {scheduledEmployees.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              No employees scheduled for {format(selectedDate, "PPP")}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading || scheduledEmployees.length === 0 || (!isBulk && !selectedEmployee)}
            >
              {isLoading ? "Saving..." : (isBulk ? "Mark Bulk Attendance" : "Mark Attendance")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

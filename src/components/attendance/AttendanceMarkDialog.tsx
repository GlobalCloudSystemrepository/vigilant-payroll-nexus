
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, MapPin, Clock, UserX, Check, ChevronsUpDown } from "lucide-react";
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
  schedule_id: string;
}

interface Vendor {
  id: string;
  company_name: string;
  vendor_id: string;
}

interface Employee {
  id: string;
  name: string;
  employee_id: string;
}

interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  status: string;
  check_in_time?: string;
  check_out_time?: string;
  notes?: string;
  replacement_type?: string;
  replacement_vendor_id?: string;
  replacement_employee_id?: string;
  replacement_notes?: string;
  is_overtime?: boolean;
  schedule_id: string;
}

interface AttendanceMarkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isBulk?: boolean;
  editRecord?: AttendanceRecord;
  onAttendanceMarked?: () => void;
}

export default function AttendanceMarkDialog({ 
  open, 
  onOpenChange, 
  isBulk = false,
  editRecord,
  onAttendanceMarked 
}: AttendanceMarkDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [scheduledEmployees, setScheduledEmployees] = useState<ScheduledEmployee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<ScheduledEmployee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [employeeSearchOpen, setEmployeeSearchOpen] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceData, setAttendanceData] = useState<Record<string, {
    status: string;
    checkIn: string;
    checkOut: string;
    notes: string;
    replacementType: string;
    replacementVendorId: string;
    replacementEmployeeId: string;
    replacementNotes: string;
    isOvertime: boolean;
    vendorCost: string;
    relievingCost: string;
    isPresent: boolean;
    isAbsent: boolean;
  }>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Helper function to safely format time
  const formatTime = (timeString?: string): string => {
    if (!timeString) return '';
    
    try {
      const date = new Date(timeString);
      if (isNaN(date.getTime())) return '';
      return format(date, 'HH:mm');
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };

  // Set initial data when editing a record
  useEffect(() => {
    if (editRecord && open && scheduledEmployees.length > 0) {
      setSelectedDate(new Date(editRecord.date));
      setSelectedEmployee(editRecord.employee_id);
      
      // Find the employee's schedule to get default times
      const employeeSchedule = scheduledEmployees.find(emp => emp.employee_id === editRecord.employee_id);
      
      const initialData = {
        status: editRecord.status,
        checkIn: formatTime(editRecord.check_in_time) || employeeSchedule?.start_time || '',
        checkOut: formatTime(editRecord.check_out_time) || employeeSchedule?.end_time || '',
        notes: editRecord.notes || '',
        replacementType: editRecord.replacement_type || '',
        replacementVendorId: editRecord.replacement_vendor_id || '',
        replacementEmployeeId: editRecord.replacement_employee_id || '',
        replacementNotes: editRecord.replacement_notes || '',
        isOvertime: editRecord.is_overtime || false,
        vendorCost: '',
        relievingCost: '',
        isPresent: editRecord.status === 'present',
        isAbsent: editRecord.status === 'absent'
      };
      
      setAttendanceData({ [editRecord.employee_id]: initialData });
    }
  }, [editRecord, open, scheduledEmployees]);

  // Filter employees by client
  useEffect(() => {
    if (selectedClient === "all") {
      setFilteredEmployees(scheduledEmployees);
    } else {
      const filtered = scheduledEmployees.filter(emp => emp.customer_name === selectedClient);
      setFilteredEmployees(filtered);
    }
  }, [scheduledEmployees, selectedClient]);

  useEffect(() => {
    if (open && selectedDate && !editRecord) {
      fetchScheduledEmployees();
      fetchVendors();
      fetchEmployees();
    } else if (open && editRecord) {
      fetchVendors();
      fetchEmployees();
      fetchSingleEmployeeSchedule();
    }
  }, [open, selectedDate, editRecord]);

  const fetchSingleEmployeeSchedule = async () => {
    if (!editRecord) return;
    
    setIsLoading(true);
    try {
      const { data: schedule, error } = await supabase
        .from('schedules')
        .select(`
          id,
          employee_id,
          customer_id,
          shift_date,
          start_time,
          end_time,
          location,
          employees!fk_schedules_employee(name),
          customers!fk_schedules_customer(company_name)
        `)
        .eq('id', editRecord.schedule_id)
        .single();

      if (error) throw error;

      const employeeData = {
        id: schedule.id,
        employee_id: schedule.employee_id,
        employee_name: schedule.employees?.name || 'Unknown Employee',
        customer_name: schedule.customers?.company_name || 'Unknown Customer',
        location: schedule.location || 'No location specified',
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        shift_date: schedule.shift_date,
        schedule_id: schedule.id
      };

      setScheduledEmployees([employeeData]);
    } catch (error) {
      console.error('Error fetching employee schedule:', error);
      toast({
        title: "Error",
        description: "Failed to fetch employee schedule",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
          employees!fk_schedules_employee(name),
          customers!fk_schedules_customer(company_name)
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
        shift_date: schedule.shift_date,
        schedule_id: schedule.id
      })) || [];

      setScheduledEmployees(formattedEmployees);

      // Check existing attendance and auto-fill schedule times
      if (formattedEmployees.length > 0) {
        const employeeIds = formattedEmployees.map(emp => emp.employee_id);
        const { data: attendance } = await supabase
          .from('attendance')
          .select('*')
          .in('employee_id', employeeIds)
          .eq('date', format(selectedDate, 'yyyy-MM-dd'));

        const attendanceMap: Record<string, any> = {};
        
        // Initialize with schedule times for all employees
        formattedEmployees.forEach(emp => {
          const existingAttendance = attendance?.find(att => att.employee_id === emp.employee_id);
          
          attendanceMap[emp.employee_id] = {
            status: existingAttendance?.status || '',
            checkIn: existingAttendance ? formatTime(existingAttendance.check_in_time) : emp.start_time,
            checkOut: existingAttendance ? formatTime(existingAttendance.check_out_time) : emp.end_time,
            notes: existingAttendance?.notes || '',
            replacementType: existingAttendance?.replacement_type || '',
            replacementVendorId: existingAttendance?.replacement_vendor_id || '',
            replacementEmployeeId: existingAttendance?.replacement_employee_id || '',
            replacementNotes: existingAttendance?.replacement_notes || '',
            isOvertime: existingAttendance?.is_overtime || false,
            vendorCost: '',
            relievingCost: '',
            isPresent: existingAttendance?.status === 'present' || false,
            isAbsent: existingAttendance?.status === 'absent' || false
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

  const fetchVendors = async () => {
    try {
      const { data: vendorsData, error } = await supabase
        .from('vendors')
        .select('id, company_name, vendor_id')
        .eq('status', 'active');

      if (error) throw error;
      setVendors(vendorsData || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data: employeesData, error } = await supabase
        .from('employees')
        .select('id, name, employee_id')
        .eq('status', 'active');

      if (error) throw error;
      setEmployees(employeesData || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const updateAttendance = (employeeId: string, field: string, value: string | boolean) => {
    setAttendanceData(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [field]: value,
        // Update status based on checkbox changes
        ...(field === 'isPresent' && value ? { status: 'present', isAbsent: false } : {}),
        ...(field === 'isAbsent' && value ? { status: 'absent', isPresent: false } : {}),
        ...(field === 'isPresent' && !value && prev[employeeId]?.status === 'present' ? { status: '' } : {}),
        ...(field === 'isAbsent' && !value && prev[employeeId]?.status === 'absent' ? { status: '' } : {})
      }
    }));
  };

  // Get unique clients for filter
  const uniqueClients = [...new Set(scheduledEmployees.map(emp => emp.customer_name))];

  // Select all functions
  const handleSelectAllPresent = (checked: boolean) => {
    filteredEmployees.forEach(emp => {
      updateAttendance(emp.employee_id, 'isPresent', checked);
    });
  };

  const handleSelectAllAbsent = (checked: boolean) => {
    filteredEmployees.forEach(emp => {
      updateAttendance(emp.employee_id, 'isAbsent', checked);
    });
  };

  // Check if all present/absent are selected
  const allPresentSelected = filteredEmployees.length > 0 && filteredEmployees.every(emp => 
    attendanceData[emp.employee_id]?.isPresent
  );
  const allAbsentSelected = filteredEmployees.length > 0 && filteredEmployees.every(emp => 
    attendanceData[emp.employee_id]?.isAbsent
  );

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const employeesToProcess = isBulk 
        ? filteredEmployees 
        : scheduledEmployees.filter(emp => emp.employee_id === selectedEmployee);

      for (const employee of employeesToProcess) {
        const attendance = attendanceData[employee.employee_id];
        if (!attendance?.status) continue;

        const attendanceRecord = {
          employee_id: employee.employee_id,
          schedule_id: employee.schedule_id,
          date: format(selectedDate, 'yyyy-MM-dd'),
          status: attendance.status,
          check_in_time: attendance.checkIn ? 
            new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${attendance.checkIn}:00`).toISOString() : null,
          check_out_time: attendance.checkOut ? 
            new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${attendance.checkOut}:00`).toISOString() : null,
          notes: attendance.notes || null,
          hours_worked: attendance.checkIn && attendance.checkOut ? 
            calculateHoursWorked(attendance.checkIn, attendance.checkOut) : null,
          replacement_type: attendance.status === 'absent' ? attendance.replacementType || null : null,
          replacement_vendor_id: attendance.status === 'absent' && attendance.replacementType === 'vendor' ? 
            attendance.replacementVendorId || null : null,
          replacement_employee_id: attendance.status === 'absent' && attendance.replacementType === 'employee' ? 
            attendance.replacementEmployeeId || null : null,
          replacement_notes: attendance.status === 'absent' ? attendance.replacementNotes || null : null,
          is_overtime: attendance.status === 'absent' && attendance.replacementType === 'employee' ? 
            attendance.isOvertime : false,
          relieving_cost: attendance.status === 'absent' && attendance.replacementType === 'employee' && attendance.relievingCost ? 
            parseFloat(attendance.relievingCost) : 0
        };

        if (editRecord) {
          // Update existing record
          const { error } = await supabase
            .from('attendance')
            .update(attendanceRecord)
            .eq('id', editRecord.id);

          if (error) throw error;
        } else {
          // Insert new record
          const { error } = await supabase
            .from('attendance')
            .upsert(attendanceRecord, {
              onConflict: 'employee_id,date'
            });

          if (error) throw error;
        }

        // Create vendor payment record if vendor replacement is selected and cost is provided
        if (attendance.status === 'absent' && 
            attendance.replacementType === 'vendor' && 
            attendance.replacementVendorId && 
            attendance.vendorCost && 
            parseFloat(attendance.vendorCost) > 0) {
          
          // Get customer_id from the schedule
          const { data: schedule, error: scheduleError } = await supabase
            .from('schedules')
            .select('customer_id')
            .eq('id', employee.schedule_id)
            .single();

          if (scheduleError) {
            console.error('Error fetching schedule for vendor payment:', scheduleError);
          } else if (schedule?.customer_id) {
            const vendorPayment = {
              vendor_id: attendance.replacementVendorId,
              customer_id: schedule.customer_id,
              amount: parseFloat(attendance.vendorCost),
              payment_date: format(selectedDate, 'yyyy-MM-dd'),
              notes: `Replacement for ${employee.employee_name} - ${attendance.replacementNotes || 'No additional notes'}`
            };

            const { error: paymentError } = await supabase
              .from('vendor_payments')
              .insert(vendorPayment);

            if (paymentError) {
              console.error('Error creating vendor payment:', paymentError);
              toast({
                title: "Warning",
                description: "Attendance marked but failed to create vendor payment record",
                variant: "destructive",
              });
            }
          }
        }
      }

      toast({
        title: "Success",
        description: `Attendance ${editRecord ? 'updated' : (isBulk ? 'bulk marked' : 'marked')} successfully`,
      });
      
      onOpenChange(false);
      onAttendanceMarked?.();
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast({
        title: "Error",
        description: `Failed to ${editRecord ? 'update' : 'mark'} attendance`,
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editRecord ? "Edit Attendance" : (isBulk ? "Bulk Check-in" : "Mark Attendance")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Selection - Disabled in edit mode */}
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">Select Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={!!editRecord}
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
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Client Filter for Bulk Mode */}
          {isBulk && !editRecord && (
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">Filter by Client</label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select client..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients ({scheduledEmployees.length} employees)</SelectItem>
                  {uniqueClients.map((client) => (
                    <SelectItem key={client} value={client}>
                      {client} ({scheduledEmployees.filter(emp => emp.customer_name === client).length} employees)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Employee Selection (for single attendance) - Disabled in edit mode */}
          {!isBulk && !editRecord && (
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">Select Employee</label>
              <Popover open={employeeSearchOpen} onOpenChange={setEmployeeSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={employeeSearchOpen}
                    className="w-full justify-between"
                  >
                    {selectedEmployee
                      ? scheduledEmployees.find((employee) => employee.employee_id === selectedEmployee)?.employee_name + 
                        " - " + scheduledEmployees.find((employee) => employee.employee_id === selectedEmployee)?.customer_name
                      : "Choose an employee..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search employees..." />
                    <CommandList>
                      <CommandEmpty>No employee found.</CommandEmpty>
                      <CommandGroup>
                        {scheduledEmployees.map((employee) => (
                          <CommandItem
                            key={employee.employee_id}
                            value={`${employee.employee_name} ${employee.employee_id} ${employee.customer_name}`}
                            onSelect={() => {
                              setSelectedEmployee(employee.employee_id);
                              setEmployeeSearchOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedEmployee === employee.employee_id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {employee.employee_name} ({employee.employee_id}) - {employee.customer_name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Bulk Present/Absent Controls */}
          {isBulk && !editRecord && filteredEmployees.length > 0 && (
            <div className="border rounded-lg p-4 bg-muted/20">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Quick Actions:</span>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all-present"
                    checked={allPresentSelected}
                    onCheckedChange={handleSelectAllPresent}
                  />
                  <label htmlFor="select-all-present" className="text-sm font-medium text-business-success">
                    Mark All Present
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all-absent"
                    checked={allAbsentSelected}
                    onCheckedChange={handleSelectAllAbsent}
                  />
                  <label htmlFor="select-all-absent" className="text-sm font-medium text-destructive">
                    Mark All Absent
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Scheduled Employees */}
          {(isBulk ? filteredEmployees : scheduledEmployees).length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {editRecord ? "Employee Schedule" : 
                 isBulk ? `${selectedClient === "all" ? "All" : selectedClient} Employees (${filteredEmployees.length})` :
                 `Scheduled Employees (${scheduledEmployees.length})`}
              </h3>
              
              {(isBulk ? filteredEmployees : scheduledEmployees.filter(emp => editRecord ? emp.employee_id === editRecord.employee_id : emp.employee_id === selectedEmployee)).map((employee) => (
                <div key={employee.employee_id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
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

                    {/* Present/Absent Checkboxes for Bulk Mode */}
                    {isBulk && !editRecord && (
                      <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`present-${employee.employee_id}`}
                            checked={attendanceData[employee.employee_id]?.isPresent || false}
                            onCheckedChange={(checked) => updateAttendance(employee.employee_id, 'isPresent', checked)}
                          />
                          <label htmlFor={`present-${employee.employee_id}`} className="text-sm font-medium text-business-success">
                            Present
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`absent-${employee.employee_id}`}
                            checked={attendanceData[employee.employee_id]?.isAbsent || false}
                            onCheckedChange={(checked) => updateAttendance(employee.employee_id, 'isAbsent', checked)}
                          />
                          <label htmlFor={`absent-${employee.employee_id}`} className="text-sm font-medium text-destructive">
                            Absent
                          </label>
                        </div>
                      </div>
                    )}
                    
                    {attendanceData[employee.employee_id]?.status && (
                      <Badge className={getStatusColor(attendanceData[employee.employee_id].status)}>
                        {attendanceData[employee.employee_id].status}
                      </Badge>
                    )}
                  </div>

                  {/* Status Dropdown for non-bulk mode */}
                  {!isBulk && (
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
                  )}

                  {/* Time fields for bulk mode */}
                  {isBulk && (attendanceData[employee.employee_id]?.isPresent || attendanceData[employee.employee_id]?.isAbsent) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  )}

                  {/* Replacement Section - Only show when status is absent */}
                  {attendanceData[employee.employee_id]?.status === 'absent' && (
                    <div className="border-t pt-4 space-y-4">
                      <div className="flex items-center gap-2">
                        <UserX className="h-4 w-4 text-destructive" />
                        <h5 className="font-medium text-destructive">Replacement Required</h5>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Replacement Type</label>
                          <Select 
                            value={attendanceData[employee.employee_id]?.replacementType || ""} 
                            onValueChange={(value) => {
                              updateAttendance(employee.employee_id, 'replacementType', value);
                              // Clear other replacement fields when type changes
                              updateAttendance(employee.employee_id, 'replacementVendorId', '');
                              updateAttendance(employee.employee_id, 'replacementEmployeeId', '');
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select replacement type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="vendor">Vendor</SelectItem>
                              <SelectItem value="employee">Employee</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {attendanceData[employee.employee_id]?.replacementType === 'vendor' && (
                          <div>
                            <label className="text-sm font-medium">Select Vendor</label>
                            <Select 
                              value={attendanceData[employee.employee_id]?.replacementVendorId || ""} 
                              onValueChange={(value) => updateAttendance(employee.employee_id, 'replacementVendorId', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Choose vendor" />
                              </SelectTrigger>
                              <SelectContent>
                                {vendors.map((vendor) => (
                                  <SelectItem key={vendor.id} value={vendor.id}>
                                    {vendor.company_name} ({vendor.vendor_id})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {attendanceData[employee.employee_id]?.replacementType === 'employee' && (
                          <div>
                            <label className="text-sm font-medium">Select Employee</label>
                            <Select 
                              value={attendanceData[employee.employee_id]?.replacementEmployeeId || ""} 
                              onValueChange={(value) => updateAttendance(employee.employee_id, 'replacementEmployeeId', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Choose employee" />
                              </SelectTrigger>
                              <SelectContent>
                                {employees.filter(emp => emp.id !== employee.employee_id).map((emp) => (
                                  <SelectItem key={emp.id} value={emp.id}>
                                    {emp.name} ({emp.employee_id})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div>
                           <label className="text-sm font-medium">Replacement Notes</label>
                           <Textarea
                             placeholder="Enter details about the replacement..."
                             className="resize-none"
                             value={attendanceData[employee.employee_id]?.replacementNotes || ""}
                             onChange={(e) => updateAttendance(employee.employee_id, 'replacementNotes', e.target.value)}
                           />
                         </div>

                         {attendanceData[employee.employee_id]?.replacementType === 'vendor' && (
                           <div>
                             <label className="text-sm font-medium">Vendor Cost (₹)</label>
                             <input
                               type="number"
                               placeholder="Enter cost in rupees"
                               className="w-full px-3 py-2 border border-input rounded-md"
                               value={attendanceData[employee.employee_id]?.vendorCost || ""}
                               onChange={(e) => updateAttendance(employee.employee_id, 'vendorCost', e.target.value)}
                               min="0"
                               step="0.01"
                             />
                           </div>
                         )}

                          {attendanceData[employee.employee_id]?.replacementType === 'employee' && (
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Relieving Cost (₹)</label>
                                <input
                                  type="number"
                                  placeholder="Enter relieving cost"
                                  className="w-full px-3 py-2 border border-input rounded-md"
                                  value={attendanceData[employee.employee_id]?.relievingCost || ""}
                                  onChange={(e) => updateAttendance(employee.employee_id, 'relievingCost', e.target.value)}
                                  min="0"
                                  step="0.01"
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`overtime-${employee.employee_id}`}
                                  checked={attendanceData[employee.employee_id]?.isOvertime || false}
                                  onCheckedChange={(checked) => updateAttendance(employee.employee_id, 'isOvertime', checked as boolean)}
                                />
                                <label 
                                  htmlFor={`overtime-${employee.employee_id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  This is overtime for the replacement employee
                                </label>
                              </div>
                            </div>
                          )}
                       </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {(isBulk ? filteredEmployees : scheduledEmployees).length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              {editRecord ? "Unable to load employee schedule" : 
               isBulk && filteredEmployees.length === 0 && scheduledEmployees.length > 0 ? 
               `No employees found for ${selectedClient}` :
               `No employees scheduled for ${format(selectedDate, "PPP")}`}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading || scheduledEmployees.length === 0 || (!isBulk && !selectedEmployee && !editRecord)}
            >
              {isLoading ? "Saving..." : (editRecord ? "Update Attendance" : (isBulk ? "Mark Bulk Attendance" : "Mark Attendance"))}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

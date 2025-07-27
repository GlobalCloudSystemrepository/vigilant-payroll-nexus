import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface LogOvertimeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOvertimeLogged?: () => void;
}

export default function LogOvertimeDialog({ 
  open, 
  onOpenChange, 
  onOvertimeLogged 
}: LogOvertimeDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [overtimeHours, setOvertimeHours] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch employees
  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, employee_id')
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch customers
  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, company_name, customer_id')
        .eq('status', 'active')
        .order('company_name');
      
      if (error) throw error;
      return data;
    },
  });

  const selectedEmployeeData = employees?.find(emp => emp.id === selectedEmployee);

  const calculateHoursWorked = (start: string, end: string): number => {
    const startDate = new Date(`2000-01-01T${start}:00`);
    const endDate = new Date(`2000-01-01T${end}:00`);
    const diffMs = endDate.getTime() - startDate.getTime();
    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
  };

  const handleSubmit = async () => {
    if (!selectedEmployee || !selectedCustomer || !startTime || !endTime || !overtimeHours) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const hoursWorked = calculateHoursWorked(startTime, endTime);
      
      // Create attendance record for overtime
      const attendanceRecord = {
        employee_id: selectedEmployee,
        date: format(selectedDate, 'yyyy-MM-dd'),
        status: 'present',
        check_in_time: new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${startTime}:00`).toISOString(),
        check_out_time: new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${endTime}:00`).toISOString(),
        hours_worked: hoursWorked,
        is_overtime: true,
        notes: notes || `Overtime: ${overtimeHours} hours for ${customers?.find(c => c.id === selectedCustomer)?.company_name}`
      };

      const { error } = await supabase
        .from('attendance')
        .insert(attendanceRecord);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Overtime logged successfully",
      });
      
      // Reset form
      setSelectedEmployee("");
      setSelectedCustomer("");
      setStartTime("");
      setEndTime("");
      setOvertimeHours("");
      setNotes("");
      
      onOpenChange(false);
      onOvertimeLogged?.();
    } catch (error) {
      console.error('Error logging overtime:', error);
      toast({
        title: "Error",
        description: "Failed to log overtime",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Log Employee Overtime
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Selection */}
          <div className="flex flex-col space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
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

          {/* Employee Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Employee *</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees?.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} ({employee.employee_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Employee Code</Label>
              <Input
                value={selectedEmployeeData?.employee_id || ""}
                disabled
                placeholder="Auto-filled"
                className="bg-muted"
              />
            </div>
          </div>

          {/* Customer Selection */}
          <div className="space-y-2">
            <Label>Client *</Label>
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {customers?.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.company_name} ({customer.customer_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time *</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>End Time *</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Overtime Hours */}
          <div className="space-y-2">
            <Label>Overtime Hours *</Label>
            <Select value={overtimeHours} onValueChange={setOvertimeHours}>
              <SelectTrigger>
                <SelectValue placeholder="Select overtime hours" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="8">8 Hours</SelectItem>
                <SelectItem value="12">12 Hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Calculated Hours Display */}
          {startTime && endTime && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium">
                Calculated Hours Worked: {calculateHoursWorked(startTime, endTime)} hours
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about the overtime work..."
              className="resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading || !selectedEmployee || !selectedCustomer || !startTime || !endTime || !overtimeHours}
            >
              {isLoading ? "Logging..." : "Log Overtime"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
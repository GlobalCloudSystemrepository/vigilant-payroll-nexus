import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, addDays, addWeeks, addMonths, addYears } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  Calendar as CalendarIcon, Copy, Plus, Edit, 
  Clock, MapPin, User, Users, Download, Upload 
} from "lucide-react";

const scheduleFormSchema = z.object({
  employee_id: z.string().min(1, "Please select an employee"),
  customer_id: z.string().min(1, "Please select a customer/site"),
  shift_date: z.date().optional(),
  start_time: z.string().min(1, "Please select start time"),
  end_time: z.string().min(1, "Please select end time"),
  location: z.string().optional(),
  notes: z.string().optional(),
  is_recurring: z.boolean().default(false),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]).optional(),
  recurring_start_date: z.date().optional(),
  recurring_end_date: z.date().optional(),
}).refine((data) => {
  if (!data.is_recurring && !data.shift_date) {
    return false;
  }
  if (data.is_recurring && (!data.recurring_start_date || !data.recurring_end_date || !data.frequency)) {
    return false;
  }
  return true;
}, {
  message: "Please complete all required fields",
});

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

export default function Schedules() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const [employees, setEmployees] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [stats, setStats] = useState({
    activeSites: 0,
    guardsScheduled: 0,
    shiftsToday: 0,
    scheduleChanges: 0
  });
  const [loading, setLoading] = useState(true);

  const { toast } = useToast();
  
  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      employee_id: "",
      customer_id: "",
      start_time: "",
      end_time: "",
      location: "",
      notes: "",
      is_recurring: false,
      frequency: "daily",
    },
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch employees and customers
      const [employeesResult, customersResult] = await Promise.all([
        supabase.from("employees").select("*").eq("status", "active"),
        supabase.from("customers").select("*").eq("status", "active")
      ]);

      if (employeesResult.error) throw employeesResult.error;
      if (customersResult.error) throw customersResult.error;

      setEmployees(employeesResult.data || []);
      setCustomers(customersResult.data || []);

      // Fetch schedules with explicit foreign key references to avoid ambiguity
      const schedulesResult = await supabase
        .from("schedules")
        .select(`
          *,
          employees!schedules_employee_id_fkey(name),
          customers!fk_schedules_customer(company_name)
        `)
        .gte("shift_date", startDate?.toISOString().split('T')[0])
        .lte("shift_date", endDate?.toISOString().split('T')[0])
        .order("shift_date", { ascending: true });

      if (schedulesResult.error) {
        console.error("Schedules query error:", schedulesResult.error);
        // Fallback query without joins if the explicit foreign key reference fails
        const fallbackResult = await supabase
          .from("schedules")
          .select("*")
          .gte("shift_date", startDate?.toISOString().split('T')[0])
          .lte("shift_date", endDate?.toISOString().split('T')[0])
          .order("shift_date", { ascending: true });
        
        if (fallbackResult.error) throw fallbackResult.error;
        setSchedules(fallbackResult.data || []);
      } else {
        setSchedules(schedulesResult.data || []);
      }

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's schedules for shifts count
      const todaySchedulesResult = await supabase
        .from("schedules")
        .select("*")
        .eq("shift_date", today);
      
      // Count active sites (customers with active status)
      const activeSites = customersResult.data?.length || 0;
      
      // Count scheduled guards (unique employees in schedules for the date range)
      const uniqueEmployeeIds = new Set(schedulesResult.data?.map(s => s.employee_id) || []);
      const guardsScheduled = uniqueEmployeeIds.size;
      
      // Count today's shifts
      const shiftsToday = todaySchedulesResult.data?.length || 0;

      setStats({
        activeSites,
        guardsScheduled,
        shiftsToday,
        scheduleChanges: 3 // This would need additional logic to track changes
      });

    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const generateRecurringDates = (startDate: Date, endDate: Date, frequency: string): Date[] => {
    const dates: Date[] = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      
      switch (frequency) {
        case 'daily':
          currentDate = addDays(currentDate, 1);
          break;
        case 'weekly':
          currentDate = addWeeks(currentDate, 1);
          break;
        case 'monthly':
          currentDate = addMonths(currentDate, 1);
          break;
        case 'yearly':
          currentDate = addYears(currentDate, 1);
          break;
        default:
          currentDate = addDays(currentDate, 1);
      }
    }
    
    return dates;
  };

  const onSubmit = async (data: ScheduleFormValues) => {
    try {
      if (data.is_recurring && data.recurring_start_date && data.recurring_end_date && data.frequency) {
        // Handle recurring schedules
        const dates = generateRecurringDates(data.recurring_start_date, data.recurring_end_date, data.frequency);
        
        const scheduleDataArray = dates.map(date => ({
          employee_id: data.employee_id,
          customer_id: data.customer_id,
          shift_date: date.toISOString().split('T')[0],
          start_time: data.start_time,
          end_time: data.end_time,
          location: data.location || null,
          notes: data.notes || null,
          status: 'scheduled'
        }));

        const { error } = await supabase
          .from("schedules")
          .insert(scheduleDataArray);

        if (error) throw error;

        toast({
          title: "Success",
          description: `${dates.length} recurring schedules created successfully!`,
        });
      } else {
        // Handle single schedule
        if (!data.shift_date) {
          throw new Error("Please select a shift date");
        }

        const scheduleData = {
          employee_id: data.employee_id,
          customer_id: data.customer_id,
          shift_date: data.shift_date.toISOString().split('T')[0],
          start_time: data.start_time,
          end_time: data.end_time,
          location: data.location || null,
          notes: data.notes || null,
          status: 'scheduled'
        };

        const { error } = await supabase
          .from("schedules")
          .insert([scheduleData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Schedule created successfully!",
        });
      }

      setIsCreateDialogOpen(false);
      form.reset();
      fetchData();
    } catch (error) {
      console.error("Error creating schedule:", error);
      toast({
        title: "Error",
        description: "Failed to create schedule. Please try again.",
        variant: "destructive",
      });
    }
  };

  const setQuickShift = (hours: number) => {
    if (hours === 8) {
      form.setValue("start_time", "09:00");
      form.setValue("end_time", "17:00");
    } else if (hours === 12) {
      form.setValue("start_time", "08:00");
      form.setValue("end_time", "20:00");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Present":
      case "Active": return "bg-business-success text-white";
      case "Late": return "bg-business-warning text-white";
      case "Absent": return "bg-destructive text-white";
      case "Scheduled": return "bg-primary text-white";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Schedule Management</h1>
          <p className="text-muted-foreground">Plan and manage security shift schedules</p>
        </div>
        <div className="flex gap-3">
          {/* Date Range Selectors */}
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[140px] justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "MMM dd") : "Start Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[140px] justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "MMM dd") : "End Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button variant="outline">
            <Copy className="h-4 w-4 mr-2" />
            Copy Last Month
          </Button>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import Excel
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-primary-hover">
                <Plus className="h-4 w-4 mr-2" />
                Create Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Schedule</DialogTitle>
                <DialogDescription>
                  Assign an employee to a customer site for a specific shift.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="employee_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employee</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an employee" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {employees.map((employee) => (
                              <SelectItem key={employee.id} value={employee.id}>
                                {employee.name} ({employee.employee_id})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="customer_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer/Site</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a customer site" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {customers.map((customer) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.company_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_recurring"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Create Recurring Series of Schedules
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  {form.watch("is_recurring") && (
                    <>
                      <FormField
                        control={form.control}
                        name="frequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Frequency</FormLabel>
                            <div className="grid grid-cols-4 gap-2">
                              {["daily", "weekly", "monthly", "yearly"].map((freq) => (
                                <Button
                                  key={freq}
                                  type="button"
                                  variant={field.value === freq ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => field.onChange(freq)}
                                  className="capitalize"
                                >
                                  {freq}
                                </Button>
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="recurring_start_date"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Start Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP")
                                      ) : (
                                        <span>Pick start date</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date < new Date()}
                                    initialFocus
                                    className="pointer-events-auto"
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="recurring_end_date"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>End Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP")
                                      ) : (
                                        <span>Pick end date</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date < new Date()}
                                    initialFocus
                                    className="pointer-events-auto"
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </>
                  )}

                  {!form.watch("is_recurring") && (
                    <FormField
                      control={form.control}
                      name="shift_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Shift Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                initialFocus
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="flex gap-2 mb-4">
                    <Button type="button" variant="outline" size="sm" onClick={() => setQuickShift(8)}>
                      8 Hour Shift
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setQuickShift(12)}>
                      12 Hour Shift
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="start_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="end_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Specific location within site" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Special instructions or notes" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1">
                      Create Schedule
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">{stats.activeSites}</div>
            <p className="text-sm text-muted-foreground">Active Sites</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-business-success">{stats.guardsScheduled}</div>
            <p className="text-sm text-muted-foreground">Guards Scheduled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{stats.shiftsToday}</div>
            <p className="text-sm text-muted-foreground">Shifts Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-business-warning">{stats.scheduleChanges}</div>
            <p className="text-sm text-muted-foreground">Schedule Changes</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Full Width */}
      <div>
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="today">Current Schedules</TabsTrigger>
          </TabsList>

          {/* Current Schedules */}
          <TabsContent value="today" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Schedule Overview</CardTitle>
                <CardDescription>
                  {startDate && endDate ? 
                    `${format(startDate, "MMM dd")} - ${format(endDate, "MMM dd")}` : 
                    "All schedules"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading schedules...</p>
                  </div>
                ) : schedules.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No schedules found for the selected date range.</p>
                    <p className="text-sm text-muted-foreground mt-2">Try creating a new schedule or adjusting the date range.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {schedules.map((schedule) => (
                      <div 
                        key={schedule.id}
                        className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {schedule.customers?.company_name || 'Unknown Customer'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(schedule.shift_date), 'PPP')} • {schedule.start_time} - {schedule.end_time}
                            </p>
                            {schedule.location && (
                              <p className="text-xs text-muted-foreground">📍 {schedule.location}</p>
                            )}
                          </div>
                          <Badge className={getStatusColor(schedule.status)}>
                            {schedule.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">Assigned Employee</p>
                            <div className="flex items-center text-sm">
                              <User className="h-3 w-3 mr-2 text-muted-foreground" />
                              {schedule.employees?.name || 'Unknown Employee'}
                            </div>
                          </div>
                          
                          {schedule.notes && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-2">Notes</p>
                              <p className="text-sm">{schedule.notes}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline">
                            <Copy className="h-4 w-4 mr-1" />
                            Duplicate
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

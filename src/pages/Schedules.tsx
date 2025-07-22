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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  Calendar as CalendarIcon, Copy, Plus, Edit, 
  Clock, MapPin, User, Users, Download, Upload 
} from "lucide-react";

const scheduleFormSchema = z.object({
  employee_id: z.string().min(1, "Please select an employee"),
  customer_id: z.string().min(1, "Please select a customer/site"),
  shift_date: z.date({
    required_error: "Please select a date",
  }),
  start_time: z.string().min(1, "Please select start time"),
  end_time: z.string().min(1, "Please select end time"),
  location: z.string().optional(),
  notes: z.string().optional(),
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
    },
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [employeesResult, customersResult, schedulesResult] = await Promise.all([
        supabase.from("employees").select("*").eq("status", "active"),
        supabase.from("customers").select("*").eq("status", "active"), 
        supabase
          .from("schedules")
          .select(`
            *,
            employees(name),
            customers(company_name)
          `)
          .gte("shift_date", startDate?.toISOString().split('T')[0])
          .lte("shift_date", endDate?.toISOString().split('T')[0])
          .order("shift_date", { ascending: true })
      ]);

      if (employeesResult.error) throw employeesResult.error;
      if (customersResult.error) throw customersResult.error;
      if (schedulesResult.error) throw schedulesResult.error;

      setEmployees(employeesResult.data || []);
      setCustomers(customersResult.data || []);
      setSchedules(schedulesResult.data || []);
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

  const onSubmit = async (data: ScheduleFormValues) => {
    try {
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

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case "Temporary": return "bg-business-warning text-white";
      case "Permanent": return "bg-primary text-white";
      case "Review": return "bg-business-blue text-white";
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
            <div className="text-2xl font-bold text-foreground">34</div>
            <p className="text-sm text-muted-foreground">Active Sites</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-business-success">127</div>
            <p className="text-sm text-muted-foreground">Guards Scheduled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">45</div>
            <p className="text-sm text-muted-foreground">Shifts Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-business-warning">3</div>
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

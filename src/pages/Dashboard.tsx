import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, Building2, Shield, UserCheck, DollarSign, 
  TrendingUp, AlertTriangle, Calendar, PlusCircle, BarChart3
} from "lucide-react";

interface Department {
  id: string;
  name: string;
  status: string;
}

interface Designation {
  id: string;
  name: string;
  department_id: string;
  status: string;
}

interface Employee {
  id: string;
  name: string;
  department_id: string | null;
  designation_id: string | null;
  status: string;
  created_at: string;
}

interface ChartData {
  name: string;
  count: number;
}

interface RecentActivity {
  id: string;
  type: string;
  message: string;
  time: string;
  status: string;
}

interface UpcomingPayment {
  id: string;
  type: string;
  amount: string;
  date: string;
  priority: string;
}

export default function Dashboard() {
  const [currentTime] = useState(new Date().toLocaleString());
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [upcomingPayments, setUpcomingPayments] = useState<UpcomingPayment[]>([]);
  const [chartFilter, setChartFilter] = useState("department");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Chart colors
  const chartColors = [
    "#3B82F6", "#10B981", "#F59E0B", "#EF4444", 
    "#8B5CF6", "#06B6D4", "#F97316", "#84CC16"
  ];

  useEffect(() => {
    fetchData();
    const cleanup = setupRealtimeSubscriptions();
    return cleanup;
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch departments, designations, and employees
      const [deptResult, desigResult, empResult] = await Promise.all([
        supabase.from('departments').select('*').eq('status', 'active'),
        supabase.from('designations').select('*').eq('status', 'active'),
        supabase.from('employees').select('*').eq('status', 'active')
      ]);

      if (deptResult.data) setDepartments(deptResult.data);
      if (desigResult.data) setDesignations(desigResult.data);
      if (empResult.data) setEmployees(empResult.data);
      
      // Fetch recent activity and upcoming payments
      await Promise.all([
        fetchRecentActivity(),
        fetchUpcomingPayments()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const activities: RecentActivity[] = [];
      
      // Fetch recent attendance records (simplified)
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('id, created_at, status, employee_id')
        .order('created_at', { ascending: false })
        .limit(10);

      if (attendanceData) {
        // Get employee names for attendance records
        const employeeIds = attendanceData.map(record => record.employee_id);
        const { data: employeeData } = await supabase
          .from('employees')
          .select('id, name')
          .in('id', employeeIds);

        const employeeMap = new Map(employeeData?.map(emp => [emp.id, emp.name]) || []);

        attendanceData.slice(0, 5).forEach(record => {
          const timeAgo = getTimeAgo(record.created_at);
          const employeeName = employeeMap.get(record.employee_id) || 'Unknown Employee';
          activities.push({
            id: record.id,
            type: 'attendance',
            message: `${employeeName} marked ${record.status}`,
            time: timeAgo,
            status: record.status === 'present' ? 'success' : 'warning'
          });
        });
      }

      // Fetch recent vendor payments (simplified)
      const { data: paymentsData } = await supabase
        .from('vendor_payments')
        .select('id, created_at, amount, vendor_id')
        .order('created_at', { ascending: false })
        .limit(5);

      if (paymentsData) {
        // Get vendor names for payment records
        const vendorIds = paymentsData.map(payment => payment.vendor_id);
        const { data: vendorData } = await supabase
          .from('vendors')
          .select('id, company_name')
          .in('id', vendorIds);

        const vendorMap = new Map(vendorData?.map(vendor => [vendor.id, vendor.company_name]) || []);

        paymentsData.slice(0, 3).forEach(payment => {
          const timeAgo = getTimeAgo(payment.created_at);
          const vendorName = vendorMap.get(payment.vendor_id) || 'Unknown Vendor';
          activities.push({
            id: payment.id,
            type: 'payment',
            message: `Payment processed to ${vendorName} - ₹${payment.amount}`,
            time: timeAgo,
            status: 'info'
          });
        });
      }

      // Fetch recently added employees
      const { data: newEmployees } = await supabase
        .from('employees')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(2);

      if (newEmployees) {
        newEmployees.forEach(employee => {
          const timeAgo = getTimeAgo(employee.created_at);
          activities.push({
            id: employee.id,
            type: 'new',
            message: `New employee ${employee.name} added`,
            time: timeAgo,
            status: 'success'
          });
        });
      }

      // Sort all activities by created time and take top 5
      const sortedActivities = activities
        .sort((a, b) => {
          // Convert time strings back to timestamps for proper sorting
          const getTimestamp = (timeStr: string) => {
            if (timeStr === 'Just now') return Date.now();
            const match = timeStr.match(/(\d+)\s*(min|hour|day)/);
            if (!match) return Date.now();
            const num = parseInt(match[1]);
            const unit = match[2];
            const now = Date.now();
            if (unit === 'min') return now - (num * 60 * 1000);
            if (unit === 'hour') return now - (num * 60 * 60 * 1000);
            if (unit === 'day') return now - (num * 24 * 60 * 60 * 1000);
            return now;
          };
          return getTimestamp(b.time) - getTimestamp(a.time);
        })
        .slice(0, 5);
      
      setRecentActivity(sortedActivities);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const fetchUpcomingPayments = async () => {
    try {
      const payments: UpcomingPayment[] = [];
      
      // Fetch pending cash advances (simplified)
      const { data: cashAdvances } = await supabase
        .from('cash_advances')
        .select('id, amount, date_requested, employee_id')
        .eq('status', 'pending')
        .order('date_requested', { ascending: true })
        .limit(5);

      if (cashAdvances) {
        // Get employee names for cash advances
        const employeeIds = cashAdvances.map(advance => advance.employee_id);
        const { data: employeeData } = await supabase
          .from('employees')
          .select('id, name')
          .in('id', employeeIds);

        const employeeMap = new Map(employeeData?.map(emp => [emp.id, emp.name]) || []);

        cashAdvances.slice(0, 3).forEach(advance => {
          const daysUntil = getDaysUntilDate(advance.date_requested);
          const employeeName = employeeMap.get(advance.employee_id) || 'Unknown Employee';
          payments.push({
            id: advance.id,
            type: `Cash Advance - ${employeeName}`,
            amount: `₹${advance.amount}`,
            date: daysUntil,
            priority: daysUntil.includes('Today') ? 'urgent' : 
                     daysUntil.includes('Tomorrow') ? 'high' : 'medium'
          });
        });
      }

      // Add estimated payroll payment
      if (employees.length > 0) {
        payments.push({
          id: 'payroll-1',
          type: 'Employee Salary',
          amount: `₹${employees.length * 25000}`, // Estimated based on employee count
          date: 'Tomorrow',
          priority: 'high'
        });
      }

      setUpcomingPayments(payments.slice(0, 3));
    } catch (error) {
      console.error('Error fetching upcoming payments:', error);
    }
  };

  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hour${Math.floor(diffInMinutes / 60) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffInMinutes / 1440)} day${Math.floor(diffInMinutes / 1440) > 1 ? 's' : ''} ago`;
  };

  const getDaysUntilDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const diffInDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Tomorrow';
    if (diffInDays < 0) return 'Overdue';
    return `${diffInDays} days`;
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to departments changes
    const departmentChannel = supabase
      .channel('departments-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'departments' },
        () => fetchData()
      )
      .subscribe();

    // Subscribe to designations changes
    const designationChannel = supabase
      .channel('designations-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'designations' },
        () => fetchData()
      )
      .subscribe();

    // Subscribe to employees changes
    const employeeChannel = supabase
      .channel('employees-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'employees' },
        () => fetchData()
      )
      .subscribe();

    // Subscribe to attendance changes for recent activity
    const attendanceChannel = supabase
      .channel('attendance-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'attendance' },
        () => fetchRecentActivity()
      )
      .subscribe();

    // Subscribe to vendor payments changes
    const vendorPaymentsChannel = supabase
      .channel('vendor-payments-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'vendor_payments' },
        () => {
          fetchRecentActivity();
          fetchUpcomingPayments();
        }
      )
      .subscribe();

    // Subscribe to cash advances changes
    const cashAdvancesChannel = supabase
      .channel('cash-advances-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'cash_advances' },
        () => fetchUpcomingPayments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(departmentChannel);
      supabase.removeChannel(designationChannel);
      supabase.removeChannel(employeeChannel);
      supabase.removeChannel(attendanceChannel);
      supabase.removeChannel(vendorPaymentsChannel);
      supabase.removeChannel(cashAdvancesChannel);
    };
  };

  // Calculate department-wise employee count
  const getDepartmentChartData = (): ChartData[] => {
    const departmentCounts: Record<string, ChartData> = {};
    
    departments.forEach(dept => {
      departmentCounts[dept.id] = {
        name: dept.name,
        count: 0
      };
    });

    employees.forEach(emp => {
      if (emp.department_id && departmentCounts[emp.department_id]) {
        departmentCounts[emp.department_id].count++;
      }
    });

    return Object.values(departmentCounts);
  };

  // Calculate designation-wise employee count
  const getDesignationChartData = (): ChartData[] => {
    const designationCounts: Record<string, ChartData> = {};
    
    designations.forEach(desig => {
      designationCounts[desig.id] = {
        name: desig.name,
        count: 0
      };
    });

    employees.forEach(emp => {
      if (emp.designation_id && designationCounts[emp.designation_id]) {
        designationCounts[emp.designation_id].count++;
      }
    });

    return Object.values(designationCounts);
  };

  const getTotalEmployees = () => employees.length;

  const getActiveEmployees = () => employees.filter(emp => emp.status === 'active').length;

  const stats = [
    {
      title: "Total Employees",
      value: getTotalEmployees().toString(),
      change: "+5 this month",
      icon: Users,
      color: "text-business-blue",
      bgColor: "bg-business-blue-light"
    },
    {
      title: "Active Employees",
      value: getActiveEmployees().toString(),
      change: "Currently Active",
      icon: UserCheck,
      color: "text-business-success",
      bgColor: "bg-green-50"
    },
    {
      title: "Departments",
      value: departments.length.toString(),
      change: "Total Departments",
      icon: Building2,
      color: "text-business-success",
      bgColor: "bg-green-50"
    },
    {
      title: "Designations",
      value: designations.length.toString(),
      change: "Total Designations",
      icon: Shield,
      color: "text-business-warning",
      bgColor: "bg-orange-50"
    }
  ];


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your security operations overview.</p>
        </div>
        <div className="text-sm text-muted-foreground">
          Last updated: {currentTime}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 flex-wrap">
        <Button 
          className="bg-gradient-to-r from-primary to-primary-hover shadow-business"
          onClick={() => navigate('/employees')}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Quick Add Employee
        </Button>
        <Button variant="outline" onClick={() => navigate('/attendance')}>
          <UserCheck className="h-4 w-4 mr-2" />
          Mark Attendance
        </Button>
        <Button variant="outline" onClick={() => navigate('/schedules')}>
          <Calendar className="h-4 w-4 mr-2" />
          View Schedule
        </Button>
        <Button variant="outline" onClick={() => navigate('/payroll')}>
          <DollarSign className="h-4 w-4 mr-2" />
          Process Payment
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-all duration-200 animate-scale-in">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-md ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Staff Distribution */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-foreground">Staff Distribution</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Department Staff Summary */}
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Employees by Department
              </CardTitle>
              <CardDescription>
                Real-time staff distribution across departments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                </div>
              ) : (
                <>
                  {getDepartmentChartData().map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: chartColors[index % chartColors.length] }}
                        />
                        <span className="font-medium text-foreground">{item.name}</span>
                      </div>
                      <Badge variant="secondary" className="font-bold">
                        {item.count} {item.count === 1 ? 'employee' : 'employees'}
                      </Badge>
                    </div>
                  ))}
                  
                  {getDepartmentChartData().length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No departments data available</p>
                      <p className="text-sm">Add departments and assign employees to see distribution</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Designation Staff Summary */}
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-business-success" />
                Employees by Designation
              </CardTitle>
              <CardDescription>
                Real-time staff distribution by job roles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                </div>
              ) : (
                <>
                  {getDesignationChartData().map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: chartColors[index % chartColors.length] }}
                        />
                        <span className="font-medium text-foreground">{item.name}</span>
                      </div>
                      <Badge variant="secondary" className="font-bold">
                        {item.count} {item.count === 1 ? 'employee' : 'employees'}
                      </Badge>
                    </div>
                  ))}
                  
                  {getDesignationChartData().length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No designations data available</p>
                      <p className="text-sm">Add designations and assign employees to see distribution</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest updates across your security operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded animate-pulse"></div>
                <div className="h-4 bg-muted rounded animate-pulse"></div>
                <div className="h-4 bg-muted rounded animate-pulse"></div>
              </div>
            ) : (
              <>
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.status === 'success' ? 'bg-business-success' :
                        activity.status === 'warning' ? 'bg-business-warning' : 'bg-primary'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recent activity</p>
                    <p className="text-sm">Activity will appear here as employees mark attendance and payments are processed</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Payments */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-business-success" />
              Upcoming Payments
            </CardTitle>
            <CardDescription>Scheduled payments requiring attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded animate-pulse"></div>
                <div className="h-4 bg-muted rounded animate-pulse"></div>
                <div className="h-4 bg-muted rounded animate-pulse"></div>
              </div>
            ) : (
              <>
                {upcomingPayments.length > 0 ? (
                  upcomingPayments.map((payment, index) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div>
                        <p className="font-medium text-foreground">{payment.type}</p>
                        <p className="text-sm text-muted-foreground">Due in {payment.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">{payment.amount}</p>
                        <Badge variant={
                          payment.priority === 'urgent' ? 'destructive' :
                          payment.priority === 'high' ? 'default' : 'secondary'
                        }>
                          {payment.priority}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No upcoming payments</p>
                    <p className="text-sm">Scheduled payments will appear here</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      <Card className="border-l-4 border-l-business-warning animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-business-warning">
            <AlertTriangle className="h-5 w-5" />
            Attention Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm">• 3 employees need document renewal this month</p>
            <p className="text-sm">• Site Charlie requires additional coverage tomorrow</p>
            <p className="text-sm">• Monthly payroll review due in 5 days</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
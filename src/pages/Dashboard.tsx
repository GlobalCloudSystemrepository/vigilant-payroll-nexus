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
}

interface ChartData {
  name: string;
  count: number;
}

export default function Dashboard() {
  const [currentTime] = useState(new Date().toLocaleString());
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
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
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
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

    return () => {
      supabase.removeChannel(departmentChannel);
      supabase.removeChannel(designationChannel);
      supabase.removeChannel(employeeChannel);
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

  const recentActivity = [
    { type: "attendance", message: "John Smith marked present at Site Alpha", time: "5 min ago", status: "success" },
    { type: "payment", message: "Vendor payment processed - ₹15,000", time: "12 min ago", status: "info" },
    { type: "alert", message: "Late arrival: Mike Johnson at Site Beta", time: "25 min ago", status: "warning" },
    { type: "new", message: "New employee Sarah Wilson added", time: "1 hour ago", status: "success" },
    { type: "schedule", message: "Tomorrow's schedule updated for Site Gamma", time: "2 hours ago", status: "info" }
  ];

  const upcomingPayments = [
    { type: "Employee Salary", amount: "₹2,45,000", date: "Tomorrow", priority: "high" },
    { type: "Vendor Payment", amount: "₹35,000", date: "Today", priority: "urgent" },
    { type: "Monthly Advances", amount: "₹85,000", date: "3 days", priority: "medium" }
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
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.status === 'success' ? 'bg-business-success' :
                  activity.status === 'warning' ? 'bg-business-warning' : 'bg-primary'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
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
            {upcomingPayments.map((payment, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
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
            ))}
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
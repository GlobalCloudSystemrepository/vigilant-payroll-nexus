import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Building2, Shield, UserCheck, DollarSign, 
  TrendingUp, AlertTriangle, Calendar, PlusCircle 
} from "lucide-react";

export default function Dashboard() {
  const [currentTime] = useState(new Date().toLocaleString());

  const stats = [
    {
      title: "Active Employees",
      value: "127",
      change: "+5 this month",
      icon: Users,
      color: "text-business-blue",
      bgColor: "bg-business-blue-light"
    },
    {
      title: "Customer Sites",
      value: "34",
      change: "+2 new sites",
      icon: Building2,
      color: "text-business-success",
      bgColor: "bg-green-50"
    },
    {
      title: "Relief Vendors",
      value: "12",
      change: "All active",
      icon: Shield,
      color: "text-business-warning",
      bgColor: "bg-orange-50"
    },
    {
      title: "Today's Attendance",
      value: "98.5%",
      change: "+2.1% vs yesterday",
      icon: UserCheck,
      color: "text-business-success",
      bgColor: "bg-green-50"
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
        <Button className="bg-gradient-to-r from-primary to-primary-hover shadow-business">
          <PlusCircle className="h-4 w-4 mr-2" />
          Quick Add Employee
        </Button>
        <Button variant="outline">
          <UserCheck className="h-4 w-4 mr-2" />
          Mark Attendance
        </Button>
        <Button variant="outline">
          <Calendar className="h-4 w-4 mr-2" />
          View Schedule
        </Button>
        <Button variant="outline">
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
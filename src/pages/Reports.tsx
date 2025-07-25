
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, Download, TrendingUp, TrendingDown, 
  DollarSign, Users, Calendar, BarChart3, PieChart, Filter 
} from "lucide-react";
import AttendanceReport from "@/components/reports/AttendanceReport";

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");

  const financialSummary = {
    totalRevenue: 3250000,
    totalExpenses: 2845000,
    netProfit: 405000,
    profitMargin: 12.5,
    monthlyGrowth: 8.5
  };

  const attendanceSummary = {
    averageAttendance: 95.2,
    totalWorkingDays: 30,
    totalAbsences: 45,
    lateArrivals: 23,
    overtimeHours: 340
  };

  const customerMetrics = [
    { name: "Alpha Corporate", revenue: 180000, attendance: 98.5, satisfaction: 4.8 },
    { name: "Beta Shopping Mall", revenue: 240000, attendance: 96.2, satisfaction: 4.6 },
    { name: "Gamma Residential", revenue: 120000, attendance: 94.8, satisfaction: 4.4 },
    { name: "Delta Office Complex", revenue: 150000, attendance: 97.1, satisfaction: 4.7 }
  ];

  const vendorPerformance = [
    { name: "QuickGuard Services", utilization: 85, rating: 4.8, payments: 120000 },
    { name: "Elite Security Solutions", utilization: 72, rating: 4.6, payments: 85000 },
    { name: "Reliable Guard Services", utilization: 68, rating: 4.2, payments: 75000 }
  ];

  const monthlyTrends = [
    { month: "Jan", revenue: 2800000, expenses: 2500000, guards: 120 },
    { month: "Feb", revenue: 2950000, expenses: 2600000, guards: 125 },
    { month: "Mar", revenue: 3100000, expenses: 2750000, guards: 127 },
    { month: "Apr", revenue: 3250000, expenses: 2845000, guards: 130 }
  ];

  const reportTypes = [
    {
      title: "Financial Report",
      description: "Revenue, expenses, and profit analysis",
      icon: DollarSign,
      color: "text-business-success"
    },
    {
      title: "Attendance Report", 
      description: "Employee attendance and time tracking",
      icon: Users,
      color: "text-primary"
    },
    {
      title: "Customer Report",
      description: "Client performance and satisfaction metrics",
      icon: BarChart3,
      color: "text-business-blue"
    },
    {
      title: "Vendor Report",
      description: "Relief guard vendor performance analysis",
      icon: PieChart,
      color: "text-business-warning"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground">Business intelligence and performance insights</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Date Range
          </Button>
          <Button className="bg-gradient-to-r from-primary to-primary-hover">
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {reportTypes.map((report, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${report.color}`}>
                  <report.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{report.title}</h3>
                  <p className="text-xs text-muted-foreground">{report.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Analytics */}
      <Tabs defaultValue="financial" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="attendance-report">Detailed Attendance</TabsTrigger>
          <TabsTrigger value="customer">Customer</TabsTrigger>
          <TabsTrigger value="vendor">Vendor</TabsTrigger>
        </TabsList>

        {/* Financial Analytics */}
        <TabsContent value="financial" className="space-y-6">
          {/* Financial Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-business-success" />
                  <div>
                    <div className="text-lg font-bold text-foreground">₹{financialSummary.totalRevenue.toLocaleString()}</div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-business-warning" />
                  <div>
                    <div className="text-lg font-bold text-foreground">₹{financialSummary.totalExpenses.toLocaleString()}</div>
                    <p className="text-sm text-muted-foreground">Total Expenses</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-business-success" />
                  <div>
                    <div className="text-lg font-bold text-business-success">₹{financialSummary.netProfit.toLocaleString()}</div>
                    <p className="text-sm text-muted-foreground">Net Profit</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary">{financialSummary.profitMargin}%</div>
                <p className="text-sm text-muted-foreground">Profit Margin</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-business-success">+{financialSummary.monthlyGrowth}%</div>
                <p className="text-sm text-muted-foreground">Monthly Growth</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Financial Trends</CardTitle>
              <CardDescription>Revenue and expense trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyTrends.map((month, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="font-medium">{month.month} 2024</div>
                    <div className="grid grid-cols-3 gap-8 text-sm">
                      <div className="text-center">
                        <p className="text-muted-foreground">Revenue</p>
                        <p className="font-semibold text-business-success">₹{month.revenue.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Expenses</p>
                        <p className="font-semibold text-business-warning">₹{month.expenses.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Profit</p>
                        <p className="font-semibold text-business-success">₹{(month.revenue - month.expenses).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Analytics */}
        <TabsContent value="attendance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-business-success">{attendanceSummary.averageAttendance}%</div>
                <p className="text-sm text-muted-foreground">Average Attendance</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-foreground">{attendanceSummary.totalAbsences}</div>
                <p className="text-sm text-muted-foreground">Total Absences</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-business-warning">{attendanceSummary.lateArrivals}</div>
                <p className="text-sm text-muted-foreground">Late Arrivals</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary">{attendanceSummary.overtimeHours}</div>
                <p className="text-sm text-muted-foreground">Overtime Hours</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* New Detailed Attendance Report */}
        <TabsContent value="attendance-report" className="space-y-6">
          <AttendanceReport />
        </TabsContent>

        {/* Customer Analytics */}
        <TabsContent value="customer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Performance Metrics</CardTitle>
              <CardDescription>Revenue, attendance, and satisfaction by client</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customerMetrics.map((customer, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="font-semibold">{customer.name}</div>
                    <div className="grid grid-cols-3 gap-8 text-sm">
                      <div className="text-center">
                        <p className="text-muted-foreground">Revenue</p>
                        <p className="font-semibold">₹{customer.revenue.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Attendance</p>
                        <p className="font-semibold">{customer.attendance}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Satisfaction</p>
                        <p className="font-semibold">{customer.satisfaction}/5.0</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vendor Analytics */}
        <TabsContent value="vendor" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Performance Analysis</CardTitle>
              <CardDescription>Utilization, ratings, and payment summary</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vendorPerformance.map((vendor, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="font-semibold">{vendor.name}</div>
                    <div className="grid grid-cols-3 gap-8 text-sm">
                      <div className="text-center">
                        <p className="text-muted-foreground">Utilization</p>
                        <p className="font-semibold">{vendor.utilization}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Rating</p>
                        <p className="font-semibold">{vendor.rating}/5.0</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Payments</p>
                        <p className="font-semibold">₹{vendor.payments.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

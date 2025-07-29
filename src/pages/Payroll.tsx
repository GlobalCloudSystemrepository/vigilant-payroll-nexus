
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, CreditCard, TrendingDown, TrendingUp,
  Calendar, User, AlertCircle, CheckCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";
import LogVendorPaymentForm from "@/components/payroll/LogVendorPaymentForm";
import LogCashAdvanceForm from "@/components/payroll/LogCashAdvanceForm";

export default function Payroll() {
  // Set current month to July 2025 (actual current month)
  const currentMonth = "2025-07";
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // Fetch cash advances for the selected month
  const { data: cashAdvances = [], isLoading } = useQuery({
    queryKey: ["cash-advances", selectedMonth],
    queryFn: async () => {
      const startDate = startOfMonth(new Date(selectedMonth + "-01"));
      const endDate = endOfMonth(new Date(selectedMonth + "-01"));
      
      const { data, error } = await supabase
        .from("cash_advances")
        .select(`
          id,
          employee_id,
          amount,
          reason,
          date_requested,
          date_approved,
          approved_by,
          notes,
          status
        `)
        .gte("date_requested", format(startDate, "yyyy-MM-dd"))
        .lte("date_requested", format(endDate, "yyyy-MM-dd"))
        .order("date_requested", { ascending: false });

      if (error) throw error;

      // Fetch employee details separately
      const employeeIds = [...new Set(data?.map(advance => advance.employee_id).filter(Boolean))];
      let employees: any[] = [];
      
      if (employeeIds.length > 0) {
        const { data: employeeData, error: employeeError } = await supabase
          .from("employees")
          .select("id, name, employee_id")
          .in("id", employeeIds);
        
        if (!employeeError && employeeData) {
          employees = employeeData;
        }
      }

      // Combine the data
      const combinedData = data?.map(advance => ({
        ...advance,
        employees: employees.find(emp => emp.id === advance.employee_id)
      }));

      return combinedData || [];

    },
  });

  // Transform cash advances data for display
  const advanceRequests = (cashAdvances || []).map((advance) => ({
    id: advance.id,
    employee: advance.employees?.name || "Unknown Employee",
    employeeId: advance.employees?.employee_id || "N/A",
    amount: parseFloat(advance.amount?.toString() || "0"),
    reason: advance.reason || "No reason provided",
    date: advance.date_requested,
    dateApproved: advance.date_approved,
    approvedBy: advance.approved_by || "N/A",
    notes: advance.notes || "",
    status: advance.status
  }));

  // Calculate summary statistics
  const totalAdvances = advanceRequests.reduce((sum, advance) => sum + advance.amount, 0);
  const approvedAdvances = advanceRequests
    .filter(advance => advance.status === "approved")
    .reduce((sum, advance) => sum + advance.amount, 0);

  const payrollSummary = {
    totalEmployees: 127,
    totalSalary: 2845000,
    totalAdvances: totalAdvances,
    netPayable: 2845000 - totalAdvances,
    vendorPayments: 450000
  };

  const employeePayroll = [
    {
      id: "EMP001",
      name: "John Smith",
      baseSalary: 25000,
      overtime: 2000,
      advance: 2000,
      deductions: 500,
      netSalary: 24500,
      status: "Processed"
    },
    {
      id: "EMP002",
      name: "Sarah Wilson", 
      baseSalary: 30000,
      overtime: 1500,
      advance: 0,
      deductions: 600,
      netSalary: 30900,
      status: "Pending"
    },
    {
      id: "EMP003",
      name: "Mike Johnson",
      baseSalary: 22000,
      overtime: 800,
      advance: 3000,
      deductions: 400,
      netSalary: 19400,
      status: "Pending"
    }
  ];

  const vendorPayments = [
    {
      id: "VEN001",
      name: "QuickGuard Services",
      guards: 5,
      dailyRate: 800,
      daysWorked: 30,
      totalAmount: 120000,
      status: "Paid"
    },
    {
      id: "VEN002",
      name: "Elite Security Solutions",
      guards: 3,
      dailyRate: 750,
      daysWorked: 25,
      totalAmount: 56250,
      status: "Pending"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "processed":
      case "paid":
      case "approved": return "bg-business-success text-white";
      case "pending": return "bg-business-warning text-white";
      case "rejected": return "bg-destructive text-white";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payroll Management</h1>
          <p className="text-muted-foreground">Manage employee salaries, advances, and vendor payments</p>
        </div>
        <div className="flex gap-3">
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-40"
          />
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
          <LogVendorPaymentForm />
          <LogCashAdvanceForm />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold text-foreground">{payrollSummary.totalEmployees}</div>
                <p className="text-sm text-muted-foreground">Employees</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-business-success" />
              <div>
                <div className="text-lg font-bold text-foreground">₹{payrollSummary.totalSalary.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Total Salary</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-business-warning" />
              <div>
                <div className="text-lg font-bold text-foreground">₹{payrollSummary.totalAdvances.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Advances</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-business-success" />
              <div>
                <div className="text-lg font-bold text-foreground">₹{payrollSummary.netPayable.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Net Payable</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <div>
                <div className="text-lg font-bold text-foreground">₹{payrollSummary.vendorPayments.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Vendor Payments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="employee" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="employee">Employee Payroll</TabsTrigger>
          <TabsTrigger value="vendor">Vendor Payments</TabsTrigger>
          <TabsTrigger value="advances">Advances</TabsTrigger>
        </TabsList>

        {/* Employee Payroll */}
        <TabsContent value="employee" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Employee Payroll</CardTitle>
              <CardDescription>Salary breakdown for {selectedMonth}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employeePayroll.map((employee) => (
                  <div 
                    key={employee.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{employee.name}</h3>
                        <p className="text-sm text-muted-foreground">{employee.id}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-5 gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-muted-foreground">Base</p>
                        <p className="font-medium">₹{employee.baseSalary.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Overtime</p>
                        <p className="font-medium text-business-success">₹{employee.overtime.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Advance</p>
                        <p className="font-medium text-business-warning">₹{employee.advance.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Deductions</p>
                        <p className="font-medium text-destructive">₹{employee.deductions.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Net Salary</p>
                        <p className="font-bold text-foreground">₹{employee.netSalary.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <Badge className={getStatusColor(employee.status)}>
                      {employee.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vendor Payments */}
        <TabsContent value="vendor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Vendor Payments</CardTitle>
              <CardDescription>Relief guard service payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vendorPayments.map((vendor) => (
                  <div 
                    key={vendor.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-business-blue-light rounded-full flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-business-blue" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{vendor.name}</h3>
                        <p className="text-sm text-muted-foreground">{vendor.id}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-muted-foreground">Guards</p>
                        <p className="font-medium">{vendor.guards}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Daily Rate</p>
                        <p className="font-medium">₹{vendor.dailyRate}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Days</p>
                        <p className="font-medium">{vendor.daysWorked}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Total Amount</p>
                        <p className="font-bold text-foreground">₹{vendor.totalAmount.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <Badge className={getStatusColor(vendor.status)}>
                      {vendor.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advances */}
        <TabsContent value="advances" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advance Requests</CardTitle>
              <CardDescription>Employee cash advance tracking</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading advances...</p>
                </div>
              ) : advanceRequests.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No cash advances found for {selectedMonth}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {advanceRequests.map((advance) => (
                    <div 
                      key={advance.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-business-warning/10 rounded-full flex items-center justify-center">
                          <AlertCircle className="h-5 w-5 text-business-warning" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{advance.employee}</h3>
                          <p className="text-sm text-muted-foreground">{advance.employeeId} • {advance.date}</p>
                          <p className="text-sm text-muted-foreground">{advance.reason}</p>
                          {advance.notes && (
                            <p className="text-xs text-muted-foreground mt-1">Notes: {advance.notes}</p>
                          )}
                          {advance.dateApproved && (
                            <p className="text-xs text-muted-foreground">
                              Approved: {advance.dateApproved} by {advance.approvedBy}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-foreground">₹{advance.amount.toLocaleString()}</p>
                        </div>
                        <Badge className={getStatusColor(advance.status)}>
                          {advance.status}
                        </Badge>
                        {advance.status === "pending" && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <CheckCircle className="h-4 w-4 text-business-success" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
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
  );
}

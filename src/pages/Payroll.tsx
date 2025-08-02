
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

  // Fetch employees data
  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("status", "active");

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch cash advances for the selected month
  const { data: cashAdvances = [], isLoading: advancesLoading } = useQuery({
    queryKey: ["cash-advances", selectedMonth],
    queryFn: async () => {
      const year = selectedMonth.split('-')[0];
      const month = selectedMonth.split('-')[1];
      const startDate = `${year}-${month}-01`;
      const endDate = `${year}-${month}-31`;
      
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
        .gte("date_requested", startDate)
        .lte("date_requested", endDate)
        .order("date_requested", { ascending: false });

      if (error) throw error;

      // Add employee details
      const combinedData = data?.map(advance => {
        const employee = employees.find(emp => emp.id === advance.employee_id);
        return {
          ...advance,
          employees: employee
        };
      });

      return combinedData || [];
    },
    enabled: employees.length > 0,
  });

  // Fetch attendance for overtime calculation
  const { data: attendanceData = [] } = useQuery({
    queryKey: ["attendance-overtime", selectedMonth],
    queryFn: async () => {
      const year = selectedMonth.split('-')[0];
      const month = selectedMonth.split('-')[1];
      const startDate = `${year}-${month}-01`;
      const endDate = `${year}-${month}-31`;
      
      const { data, error } = await supabase
        .from("attendance")
        .select("employee_id, hours_worked, is_overtime")
        .gte("date", startDate)
        .lte("date", endDate)
        .eq("is_overtime", true);

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch vendor payments for the selected month
  const { data: vendorPayments = [] } = useQuery({
    queryKey: ["vendor-payments", selectedMonth],
    queryFn: async () => {
      const year = selectedMonth.split('-')[0];
      const month = selectedMonth.split('-')[1];
      const startDate = `${year}-${month}-01`;
      const endDate = `${year}-${month}-31`;
      
      const { data, error } = await supabase
        .from("vendor_payments")
        .select(`
          *,
          vendors:vendor_id (company_name, vendor_id),
          customers:customer_id (company_name)
        `)
        .gte("payment_date", startDate)
        .lte("payment_date", endDate);

      if (error) throw error;
      return data || [];
    },
  });

  // Calculate overtime hours per employee
  const overtimeByEmployee = attendanceData.reduce((acc, record) => {
    if (!acc[record.employee_id]) {
      acc[record.employee_id] = 0;
    }
    acc[record.employee_id] += parseFloat(record.hours_worked?.toString() || "0");
    return acc;
  }, {} as Record<string, number>);

  // Calculate advances per employee for the month
  const advancesByEmployee = cashAdvances.reduce((acc, advance) => {
    if (advance.status === "approved" && advance.employee_id) {
      if (!acc[advance.employee_id]) {
        acc[advance.employee_id] = 0;
      }
      acc[advance.employee_id] += parseFloat(advance.amount?.toString() || "0");
    }
    return acc;
  }, {} as Record<string, number>);

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

  // Calculate employee payroll from real data
  const employeePayroll = employees.map((employee) => {
    const baseSalary = parseFloat(employee.salary?.toString() || "0");
    const overtimeHours = overtimeByEmployee[employee.id] || 0;
    const overtimeRate = 150; // ₹150 per hour - you can make this configurable
    const overtimePay = overtimeHours * overtimeRate;
    const advance = advancesByEmployee[employee.id] || 0;
    const deductions = 0; // Use net_salary as it already includes deductions
    const grossSalary = baseSalary + overtimePay;
    const netSalary = grossSalary - advance;

    return {
      id: employee.employee_id,
      name: employee.name,
      baseSalary: baseSalary,
      overtime: overtimePay,
      advance: advance,
      deductions: deductions,
      netSalary: netSalary,
      status: "Pending" // You can add logic to determine status from payroll table
    };
  });

  // Calculate totals from real data
  const totalEmployees = employees.length;
  const totalSalary = employeePayroll.reduce((sum, emp) => sum + emp.baseSalary + emp.overtime, 0);
  const totalAdvances = advanceRequests
    .filter(advance => advance.status === "approved")
    .reduce((sum, advance) => sum + advance.amount, 0);
  const totalVendorPayments = vendorPayments.reduce((sum, payment) => sum + parseFloat(payment.amount?.toString() || "0"), 0);
  const netPayable = totalSalary - totalAdvances;

  const payrollSummary = {
    totalEmployees,
    totalSalary,
    totalAdvances,
    netPayable,
    vendorPayments: totalVendorPayments
  };

  // Transform vendor payments for display
  const vendorPaymentsList = vendorPayments.map((payment) => ({
    id: payment.vendors?.vendor_id || "N/A",
    name: payment.vendors?.company_name || "Unknown Vendor",
    customer: payment.customers?.company_name || "Unknown Customer",
    amount: parseFloat(payment.amount?.toString() || "0"),
    date: payment.payment_date,
    notes: payment.notes || "",
    status: "Paid" // All records in vendor_payments are considered paid
  }));

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
              {employeesLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading employee payroll...</p>
                </div>
              ) : employeePayroll.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No employees found</p>
                </div>
              ) : (
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
              )}
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
              {vendorPaymentsList.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No vendor payments found for {selectedMonth}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {vendorPaymentsList.map((payment, index) => (
                    <div 
                      key={`${payment.id}-${index}`}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-business-blue-light rounded-full flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-business-blue" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{payment.name}</h3>
                          <p className="text-sm text-muted-foreground">{payment.id}</p>
                          <p className="text-sm text-muted-foreground">Customer: {payment.customer}</p>
                          {payment.notes && (
                            <p className="text-xs text-muted-foreground">Notes: {payment.notes}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-muted-foreground text-sm">Payment Date</p>
                          <p className="font-medium">{payment.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground text-sm">Amount</p>
                          <p className="font-bold text-foreground">₹{payment.amount.toLocaleString()}</p>
                        </div>
                        <Badge className={getStatusColor(payment.status)}>
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
              {advancesLoading ? (
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

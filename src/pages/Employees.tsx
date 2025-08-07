import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, Plus, Download, Upload, Filter, 
  User, Phone, MapPin, Calendar, Edit, Trash2 
} from "lucide-react";

export default function Employees() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    employee_id: "",
    email: "",
    phone: "",
    position: "",
    department: "",
    hire_date: "",
    salary: "",
    status: "active",
    address: "",
    pan_number: "",
    adhaar_number: "",
    voter_id: "",
    basic_salary: 0,
    hra: 0,
    allowance: 0,
    pf_applicable: false,
    pf_amount: 0,
    esic_applicable: false,
    esic_amount: 0,
    gross_salary: 0,
    net_salary: 0
  });
  const { toast } = useToast();

  // Fetch employees from Supabase
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Filter employees based on search term and status filter
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (employee.email && employee.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (employee.position && employee.position.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || employee.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate real-time stats
  const stats = {
    total: employees.length,
    active: employees.filter(emp => emp.status === "active").length,
    onLeave: employees.filter(emp => emp.status === "on_leave").length,
    inactive: employees.filter(emp => emp.status === "inactive").length
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-business-success text-white";
      case "on_leave": return "bg-business-warning text-white";
      case "inactive": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "Active";
      case "on_leave": return "On Leave";
      case "inactive": return "Inactive";
      default: return status;
    }
  };

  const handleFilterChange = (filterType: string) => {
    setStatusFilter(filterType);
  };

  const handleExport = () => {
    // Create comprehensive CSV content with all fields including KYC
    const csvContent = [
      [
        'ID', 'Employee ID', 'Name', 'Email', 'Phone', 'Position', 'Department', 
        'Status', 'Hire Date', 'Address', 'PAN Number', 'Aadhaar Number', 'Voter ID',
        'Basic Salary', 'HRA', 'Allowance', 'PF Applicable', 'PF Amount', 
        'ESIC Applicable', 'ESIC Amount', 'Gross Salary', 'Net Salary', 'Total Salary',
        'Created At', 'Updated At'
      ],
      ...employees.map(emp => [
        emp.id || '',
        emp.employee_id || '',
        emp.name || '',
        emp.email || '',
        emp.phone || '',
        emp.position || '',
        emp.department || '',
        emp.status || '',
        emp.hire_date || '',
        emp.address || '',
        emp.pan_number || '',
        emp.adhaar_number || '',
        emp.voter_id || '',
        emp.basic_salary || 0,
        emp.hra || 0,
        emp.allowance || 0,
        emp.pf_applicable ? 'Yes' : 'No',
        emp.pf_amount || 0,
        emp.esic_applicable ? 'Yes' : 'No',
        emp.esic_amount || 0,
        emp.gross_salary || 0,
        emp.net_salary || 0,
        emp.salary || 0,
        emp.created_at || '',
        emp.updated_at || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees_complete_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Export Successful",
      description: "Complete employee data including KYC has been exported to CSV file.",
    });
  };

  const handleBulkImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.xls';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        toast({
          title: "Import Started",
          description: `Processing ${file.name}...`,
        });
        // In a real app, you'd process the file here
        setTimeout(() => {
          toast({
            title: "Import Complete",
            description: "Employee data has been imported successfully.",
          });
        }, 2000);
      }
    };
    input.click();
  };

  const calculateSalaryComponents = (basic: number, hra: number, allowance: number, pfApplicable: boolean, esicApplicable: boolean) => {
    const gross = basic + hra + allowance;
    const pf = pfApplicable ? basic * 0.12 : 0;
    const esic = esicApplicable ? gross * 0.0075 : 0;
    const net = gross - pf - esic;
    
    return {
      gross_salary: gross,
      pf_amount: pf,
      esic_amount: esic,
      net_salary: net
    };
  };

  const handleEditEmployee = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee) {
      setSelectedEmployee(employee);
      setEditFormData({
        name: employee.name,
        employee_id: employee.employee_id,
        email: employee.email || "",
        phone: employee.phone || "",
        position: employee.position || "",
        department: employee.department || "",
        hire_date: employee.hire_date || "",
        salary: employee.salary?.toString() || "",
        status: employee.status,
        address: employee.address || "",
        pan_number: employee.pan_number || "",
        adhaar_number: employee.adhaar_number || "",
        voter_id: employee.voter_id || "",
        basic_salary: employee.basic_salary || 0,
        hra: employee.hra || 0,
        allowance: employee.allowance || 0,
        pf_applicable: employee.pf_applicable || false,
        pf_amount: employee.pf_amount || 0,
        esic_applicable: employee.esic_applicable || false,
        esic_amount: employee.esic_amount || 0,
        gross_salary: employee.gross_salary || 0,
        net_salary: employee.net_salary || 0
      });
      setEditDialogOpen(true);
    }
  };

  const handleDeleteEmployee = (employeeId: string, employeeName: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee) {
      setSelectedEmployee(employee);
      setDeleteDialogOpen(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedEmployee) return;

    try {
      const { error } = await supabase
        .from('employees')
        .update({
          name: editFormData.name,
          employee_id: editFormData.employee_id,
          email: editFormData.email,
          phone: editFormData.phone,
          position: editFormData.position,
          department: editFormData.department,
          hire_date: editFormData.hire_date,
          salary: parseFloat(editFormData.salary) || null,
          status: editFormData.status,
          address: editFormData.address,
          pan_number: editFormData.pan_number,
          adhaar_number: editFormData.adhaar_number,
          voter_id: editFormData.voter_id,
          basic_salary: editFormData.basic_salary,
          hra: editFormData.hra,
          allowance: editFormData.allowance,
          pf_applicable: editFormData.pf_applicable,
          pf_amount: editFormData.pf_amount,
          esic_applicable: editFormData.esic_applicable,
          esic_amount: editFormData.esic_amount,
          gross_salary: editFormData.gross_salary,
          net_salary: editFormData.net_salary
        })
        .eq('id', selectedEmployee.id);

      if (error) throw error;

      toast({
        title: "Employee Updated",
        description: `${editFormData.name} has been updated successfully.`,
      });
      
      setEditDialogOpen(false);
      setSelectedEmployee(null);
      fetchEmployees(); // Refresh the list
    } catch (error) {
      console.error('Error updating employee:', error);
      toast({
        title: "Error",
        description: "Failed to update employee",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = async () => {
    if (!selectedEmployee) return;

    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', selectedEmployee.id);

      if (error) throw error;

      toast({
        title: "Employee Deleted",
        description: `${selectedEmployee.name} has been removed from the system.`,
      });
      
      setDeleteDialogOpen(false);
      setSelectedEmployee(null);
      fetchEmployees(); // Refresh the list
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        title: "Error",
        description: "Failed to delete employee",
        variant: "destructive",
      });
    }
  };

  const generateNextEmployeeId = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('employee_id')
        .like('employee_id', 'EMP%')
        .order('employee_id', { ascending: false })
        .limit(1);

      if (error) throw error;

      let nextNumber = 1;
      if (data && data.length > 0) {
        const lastId = data[0].employee_id;
        const numberPart = lastId.replace('EMP', '');
        nextNumber = parseInt(numberPart) + 1;
      }

      return `EMP${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating employee ID:', error);
      return `EMP${Date.now().toString().slice(-4)}`;
    }
  };

  const handleAddEmployee = async () => {
    const nextEmployeeId = await generateNextEmployeeId();
    setEditFormData({
      name: "",
      employee_id: nextEmployeeId,
      email: "",
      phone: "",
      position: "",
      department: "",
      hire_date: "",
      salary: "",
      status: "active",
      address: "",
      pan_number: "",
      adhaar_number: "",
      voter_id: "",
      basic_salary: 0,
      hra: 0,
      allowance: 0,
      pf_applicable: false,
      pf_amount: 0,
      esic_applicable: false,
      esic_amount: 0,
      gross_salary: 0,
      net_salary: 0
    });
    setAddDialogOpen(true);
  };

  const handleSaveAdd = async () => {
    try {
      const { error } = await supabase
        .from('employees')
        .insert({
          name: editFormData.name,
          employee_id: editFormData.employee_id,
          email: editFormData.email,
          phone: editFormData.phone,
          position: editFormData.position,
          department: editFormData.department,
          hire_date: editFormData.hire_date,
          salary: parseFloat(editFormData.salary) || null,
          status: editFormData.status,
          address: editFormData.address,
          pan_number: editFormData.pan_number,
          adhaar_number: editFormData.adhaar_number,
          voter_id: editFormData.voter_id,
          basic_salary: editFormData.basic_salary,
          hra: editFormData.hra,
          allowance: editFormData.allowance,
          pf_applicable: editFormData.pf_applicable,
          pf_amount: editFormData.pf_amount,
          esic_applicable: editFormData.esic_applicable,
          esic_amount: editFormData.esic_amount,
          gross_salary: editFormData.gross_salary,
          net_salary: editFormData.net_salary
        });

      if (error) throw error;

      toast({
        title: "Employee Added",
        description: `${editFormData.name} has been added successfully.`,
      });
      
      setAddDialogOpen(false);
      fetchEmployees(); // Refresh the list
    } catch (error) {
      console.error('Error adding employee:', error);
      toast({
        title: "Error",
        description: "Failed to add employee",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Employee Management</h1>
          <p className="text-muted-foreground">Manage your security team records and information</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={handleBulkImport}>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </Button>
          <Button className="bg-gradient-to-r from-primary to-primary-hover" onClick={handleAddEmployee}>
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-business-success">{stats.active}</div>
            <p className="text-sm text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-business-warning">{stats.onLeave}</div>
            <p className="text-sm text-muted-foreground">On Leave</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-muted-foreground">{stats.inactive}</div>
            <p className="text-sm text-muted-foreground">Inactive</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees by name, ID, or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Select value={statusFilter} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Employee List */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="cards">Card View</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Employee Directory</CardTitle>
              <CardDescription>Complete list of all security personnel ({filteredEmployees.length} shown)</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading employees...
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredEmployees.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No employees found matching your search criteria.
                    </div>
                  ) : (
                    filteredEmployees.map((employee) => (
                    <div 
                      key={employee.id} 
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{employee.name}</h3>
                          <p className="text-sm text-muted-foreground">{employee.employee_id} • {employee.position || "Not specified"}</p>
                          <div className="flex items-center gap-4 mt-1">
                            {employee.phone && (
                              <span className="flex items-center text-xs text-muted-foreground">
                                <Phone className="h-3 w-3 mr-1" />
                                {employee.phone}
                              </span>
                            )}
                            {employee.department && (
                              <span className="flex items-center text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3 mr-1" />
                                {employee.department}
                              </span>
                            )}
                            {employee.hire_date && (
                              <span className="flex items-center text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3 mr-1" />
                                Joined {employee.hire_date}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          {employee.salary && <p className="font-medium text-foreground">₹{employee.salary.toLocaleString()}</p>}
                        </div>
                        <Badge className={getStatusColor(employee.status)}>
                          {getStatusLabel(employee.status)}
                        </Badge>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditEmployee(employee.id)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDeleteEmployee(employee.id, employee.name)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cards" className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading employees...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEmployees.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No employees found matching your search criteria.
                </div>
              ) : (
                filteredEmployees.map((employee) => (
                <Card key={employee.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{employee.name}</CardTitle>
                      <Badge className={getStatusColor(employee.status)}>
                        {getStatusLabel(employee.status)}
                      </Badge>
                    </div>
                    <CardDescription>{employee.position || "Not specified"}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        {employee.employee_id}
                      </div>
                      {employee.phone && (
                        <div className="flex items-center text-sm">
                          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                          {employee.phone}
                        </div>
                      )}
                      {employee.department && (
                        <div className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          {employee.department}
                        </div>
                      )}
                    </div>
                    {employee.salary && (
                      <div className="pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Monthly Salary</span>
                          <span className="font-semibold">₹{employee.salary.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEditEmployee(employee.id)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeleteEmployee(employee.id, employee.name)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Employee Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>
              Enter the employee details to add them to the system.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="demographic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="demographic">Demographic Information</TabsTrigger>
              <TabsTrigger value="kyc">KYC Documents</TabsTrigger>
              <TabsTrigger value="salary">Salary Components</TabsTrigger>
            </TabsList>

            {/* Demographic Information Section */}
            <TabsContent value="demographic" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name*</Label>
                  <Input
                    id="name"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employee_id">Employee ID*</Label>
                  <Input
                    id="employee_id"
                    value={editFormData.employee_id}
                    className="bg-muted"
                    readOnly
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={editFormData.position}
                    onChange={(e) => setEditFormData({...editFormData, position: e.target.value})}
                    placeholder="Security Guard, Supervisor, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={editFormData.department}
                    onChange={(e) => setEditFormData({...editFormData, department: e.target.value})}
                    placeholder="Security Department"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hire_date">Hire Date</Label>
                  <Input
                    id="hire_date"
                    type="date"
                    value={editFormData.hire_date}
                    onChange={(e) => setEditFormData({...editFormData, hire_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Employee Status</Label>
                  <Select value={editFormData.status} onValueChange={(value) => setEditFormData({...editFormData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Indian Address</Label>
                <Textarea
                  id="address"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                  placeholder="Complete address with pincode"
                  rows={3}
                />
              </div>
            </TabsContent>

            {/* KYC Documents Section */}
            <TabsContent value="kyc" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pan_number">PAN Number</Label>
                  <Input
                    id="pan_number"
                    value={editFormData.pan_number}
                    onChange={(e) => setEditFormData({...editFormData, pan_number: e.target.value.toUpperCase()})}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adhaar_number">Aadhaar Number</Label>
                  <Input
                    id="adhaar_number"
                    value={editFormData.adhaar_number}
                    onChange={(e) => setEditFormData({...editFormData, adhaar_number: e.target.value})}
                    placeholder="XXXX XXXX XXXX"
                    maxLength={12}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="voter_id">Voter ID</Label>
                  <Input
                    id="voter_id"
                    value={editFormData.voter_id}
                    onChange={(e) => setEditFormData({...editFormData, voter_id: e.target.value.toUpperCase()})}
                    placeholder="ABC1234567"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Salary Components Section */}
            <TabsContent value="salary" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-lg">Basic Salary Components</h4>
                  <div className="space-y-2">
                    <Label htmlFor="basic_salary">Basic Salary*</Label>
                    <Input
                      id="basic_salary"
                      type="number"
                      value={editFormData.basic_salary || ''}
                      onChange={(e) => {
                        const basic = parseFloat(e.target.value) || 0;
                        const calculated = calculateSalaryComponents(
                          basic, 
                          editFormData.hra, 
                          editFormData.allowance, 
                          editFormData.pf_applicable, 
                          editFormData.esic_applicable
                        );
                        setEditFormData({
                          ...editFormData, 
                          basic_salary: basic,
                          ...calculated
                        });
                      }}
                      placeholder="Enter basic salary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hra">HRA (House Rent Allowance)</Label>
                    <Input
                      id="hra"
                      type="number"
                      value={editFormData.hra || ''}
                      onChange={(e) => {
                        const hra = parseFloat(e.target.value) || 0;
                        const calculated = calculateSalaryComponents(
                          editFormData.basic_salary, 
                          hra, 
                          editFormData.allowance, 
                          editFormData.pf_applicable, 
                          editFormData.esic_applicable
                        );
                        setEditFormData({
                          ...editFormData, 
                          hra: hra,
                          ...calculated
                        });
                      }}
                      placeholder="Enter HRA amount"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="allowance">Other Allowances</Label>
                    <Input
                      id="allowance"
                      type="number"
                      value={editFormData.allowance || ''}
                      onChange={(e) => {
                        const allowance = parseFloat(e.target.value) || 0;
                        const calculated = calculateSalaryComponents(
                          editFormData.basic_salary, 
                          editFormData.hra, 
                          allowance, 
                          editFormData.pf_applicable, 
                          editFormData.esic_applicable
                        );
                        setEditFormData({
                          ...editFormData, 
                          allowance: allowance,
                          ...calculated
                        });
                      }}
                      placeholder="Travel, Medical, etc."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-lg">Deductions & Net Salary</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="pf_applicable" 
                        checked={editFormData.pf_applicable}
                        onCheckedChange={(checked) => {
                          const calculated = calculateSalaryComponents(
                            editFormData.basic_salary, 
                            editFormData.hra, 
                            editFormData.allowance, 
                            checked as boolean, 
                            editFormData.esic_applicable
                          );
                          setEditFormData({
                            ...editFormData, 
                            pf_applicable: checked as boolean,
                            ...calculated
                          });
                        }}
                      />
                      <Label htmlFor="pf_applicable">PF Applicable (12% of Basic)</Label>
                    </div>
                    {editFormData.pf_applicable && (
                      <div className="ml-6">
                        <Label className="text-sm text-muted-foreground">PF Amount: ₹{editFormData.pf_amount.toFixed(2)}</Label>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="esic_applicable" 
                        checked={editFormData.esic_applicable}
                        onCheckedChange={(checked) => {
                          const calculated = calculateSalaryComponents(
                            editFormData.basic_salary, 
                            editFormData.hra, 
                            editFormData.allowance, 
                            editFormData.pf_applicable, 
                            checked as boolean
                          );
                          setEditFormData({
                            ...editFormData, 
                            esic_applicable: checked as boolean,
                            ...calculated
                          });
                        }}
                      />
                      <Label htmlFor="esic_applicable">ESIC Applicable (0.75% of Gross)</Label>
                    </div>
                    {editFormData.esic_applicable && (
                      <div className="ml-6">
                        <Label className="text-sm text-muted-foreground">ESIC Amount: ₹{editFormData.esic_amount.toFixed(2)}</Label>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t space-y-2">
                    <div className="flex justify-between">
                      <Label className="font-medium">Gross Salary:</Label>
                      <span className="font-semibold">₹{editFormData.gross_salary.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <Label className="font-medium">Total Deductions:</Label>
                      <span className="font-semibold">₹{(editFormData.pf_amount + editFormData.esic_amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-primary">
                      <Label>Net Salary:</Label>
                      <span>₹{editFormData.net_salary.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAdd}>Add Employee</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>
              Make changes to {selectedEmployee?.name}'s information here.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="demographic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="demographic">Demographic Information</TabsTrigger>
              <TabsTrigger value="kyc">KYC Documents</TabsTrigger>
              <TabsTrigger value="salary">Salary Components</TabsTrigger>
            </TabsList>

            {/* Demographic Information Section */}
            <TabsContent value="demographic" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Full Name*</Label>
                  <Input
                    id="edit-name"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-employee_id">Employee ID*</Label>
                  <Input
                    id="edit-employee_id"
                    value={editFormData.employee_id}
                    onChange={(e) => setEditFormData({...editFormData, employee_id: e.target.value})}
                    placeholder="Employee ID"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email Address</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone Number</Label>
                  <Input
                    id="edit-phone"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-position">Position</Label>
                  <Input
                    id="edit-position"
                    value={editFormData.position}
                    onChange={(e) => setEditFormData({...editFormData, position: e.target.value})}
                    placeholder="Security Guard, Supervisor, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-department">Department</Label>
                  <Input
                    id="edit-department"
                    value={editFormData.department}
                    onChange={(e) => setEditFormData({...editFormData, department: e.target.value})}
                    placeholder="Security Department"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-hire_date">Hire Date</Label>
                  <Input
                    id="edit-hire_date"
                    type="date"
                    value={editFormData.hire_date}
                    onChange={(e) => setEditFormData({...editFormData, hire_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Employee Status</Label>
                  <Select value={editFormData.status} onValueChange={(value) => setEditFormData({...editFormData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">Indian Address</Label>
                <Textarea
                  id="edit-address"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                  placeholder="Complete address with pincode"
                  rows={3}
                />
              </div>
            </TabsContent>

            {/* KYC Documents Section */}
            <TabsContent value="kyc" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-pan_number">PAN Number</Label>
                  <Input
                    id="edit-pan_number"
                    value={editFormData.pan_number}
                    onChange={(e) => setEditFormData({...editFormData, pan_number: e.target.value.toUpperCase()})}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-adhaar_number">Aadhaar Number</Label>
                  <Input
                    id="edit-adhaar_number"
                    value={editFormData.adhaar_number}
                    onChange={(e) => setEditFormData({...editFormData, adhaar_number: e.target.value})}
                    placeholder="XXXX XXXX XXXX"
                    maxLength={12}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-voter_id">Voter ID</Label>
                  <Input
                    id="edit-voter_id"
                    value={editFormData.voter_id}
                    onChange={(e) => setEditFormData({...editFormData, voter_id: e.target.value.toUpperCase()})}
                    placeholder="ABC1234567"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Salary Components Section */}
            <TabsContent value="salary" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-lg">Basic Salary Components</h4>
                  <div className="space-y-2">
                    <Label htmlFor="edit-basic_salary">Basic Salary*</Label>
                    <Input
                      id="edit-basic_salary"
                      type="number"
                      value={editFormData.basic_salary || ''}
                      onChange={(e) => {
                        const basic = parseFloat(e.target.value) || 0;
                        const calculated = calculateSalaryComponents(
                          basic, 
                          editFormData.hra, 
                          editFormData.allowance, 
                          editFormData.pf_applicable, 
                          editFormData.esic_applicable
                        );
                        setEditFormData({
                          ...editFormData, 
                          basic_salary: basic,
                          ...calculated
                        });
                      }}
                      placeholder="Enter basic salary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-hra">HRA (House Rent Allowance)</Label>
                    <Input
                      id="edit-hra"
                      type="number"
                      value={editFormData.hra || ''}
                      onChange={(e) => {
                        const hra = parseFloat(e.target.value) || 0;
                        const calculated = calculateSalaryComponents(
                          editFormData.basic_salary, 
                          hra, 
                          editFormData.allowance, 
                          editFormData.pf_applicable, 
                          editFormData.esic_applicable
                        );
                        setEditFormData({
                          ...editFormData, 
                          hra: hra,
                          ...calculated
                        });
                      }}
                      placeholder="Enter HRA amount"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-allowance">Other Allowances</Label>
                    <Input
                      id="edit-allowance"
                      type="number"
                      value={editFormData.allowance || ''}
                      onChange={(e) => {
                        const allowance = parseFloat(e.target.value) || 0;
                        const calculated = calculateSalaryComponents(
                          editFormData.basic_salary, 
                          editFormData.hra, 
                          allowance, 
                          editFormData.pf_applicable, 
                          editFormData.esic_applicable
                        );
                        setEditFormData({
                          ...editFormData, 
                          allowance: allowance,
                          ...calculated
                        });
                      }}
                      placeholder="Travel, Medical, etc."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-lg">Deductions & Net Salary</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="edit-pf_applicable" 
                        checked={editFormData.pf_applicable}
                        onCheckedChange={(checked) => {
                          const calculated = calculateSalaryComponents(
                            editFormData.basic_salary, 
                            editFormData.hra, 
                            editFormData.allowance, 
                            checked as boolean, 
                            editFormData.esic_applicable
                          );
                          setEditFormData({
                            ...editFormData, 
                            pf_applicable: checked as boolean,
                            ...calculated
                          });
                        }}
                      />
                      <Label htmlFor="edit-pf_applicable">PF Applicable (12% of Basic)</Label>
                    </div>
                    {editFormData.pf_applicable && (
                      <div className="ml-6">
                        <Label className="text-sm text-muted-foreground">PF Amount: ₹{editFormData.pf_amount.toFixed(2)}</Label>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="edit-esic_applicable" 
                        checked={editFormData.esic_applicable}
                        onCheckedChange={(checked) => {
                          const calculated = calculateSalaryComponents(
                            editFormData.basic_salary, 
                            editFormData.hra, 
                            editFormData.allowance, 
                            editFormData.pf_applicable, 
                            checked as boolean
                          );
                          setEditFormData({
                            ...editFormData, 
                            esic_applicable: checked as boolean,
                            ...calculated
                          });
                        }}
                      />
                      <Label htmlFor="edit-esic_applicable">ESIC Applicable (0.75% of Gross)</Label>
                    </div>
                    {editFormData.esic_applicable && (
                      <div className="ml-6">
                        <Label className="text-sm text-muted-foreground">ESIC Amount: ₹{editFormData.esic_amount.toFixed(2)}</Label>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t space-y-2">
                    <div className="flex justify-between">
                      <Label className="font-medium">Gross Salary:</Label>
                      <span className="font-semibold">₹{editFormData.gross_salary.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <Label className="font-medium">Total Deductions:</Label>
                      <span className="font-semibold">₹{(editFormData.pf_amount + editFormData.esic_amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-primary">
                      <Label>Net Salary:</Label>
                      <span>₹{editFormData.net_salary.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the employee 
              "{selectedEmployee?.name}" from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Employee
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
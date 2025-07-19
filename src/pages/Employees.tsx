import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, Plus, Download, Upload, Filter, 
  User, Phone, MapPin, Calendar, Edit, Trash2 
} from "lucide-react";

export default function Employees() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    phone: "",
    position: "",
    site: "",
    status: "",
    salary: ""
  });
  const { toast } = useToast();

  const employees = [
    {
      id: "EMP001",
      name: "John Smith",
      phone: "+91 98765 43210",
      position: "Senior Security Guard",
      site: "Alpha Corporate Tower",
      status: "Active",
      joinDate: "2022-01-15",
      salary: 25000,
      advance: 2000
    },
    {
      id: "EMP002", 
      name: "Sarah Wilson",
      phone: "+91 98765 43211",
      position: "Security Supervisor",
      site: "Beta Shopping Mall",
      status: "Active",
      joinDate: "2021-03-22",
      salary: 30000,
      advance: 0
    },
    {
      id: "EMP003",
      name: "Mike Johnson", 
      phone: "+91 98765 43212",
      position: "Security Guard",
      site: "Gamma Residential",
      status: "On Leave",
      joinDate: "2023-06-10",
      salary: 22000,
      advance: 3000
    }
  ];

  // Filter employees based on search term and status filter
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.site.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.position.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || employee.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate real-time stats
  const stats = {
    total: filteredEmployees.length,
    active: filteredEmployees.filter(emp => emp.status === "Active").length,
    onLeave: filteredEmployees.filter(emp => emp.status === "On Leave").length,
    inactive: filteredEmployees.filter(emp => emp.status === "Inactive").length
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-business-success text-white";
      case "On Leave": return "bg-business-warning text-white";
      case "Inactive": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const handleFilterChange = (filterType: string) => {
    setStatusFilter(filterType);
  };

  const handleExport = () => {
    // Create CSV content
    const csvContent = [
      ['ID', 'Name', 'Phone', 'Position', 'Site', 'Status', 'Join Date', 'Salary', 'Advance'],
      ...employees.map(emp => [
        emp.id, emp.name, emp.phone, emp.position, emp.site, 
        emp.status, emp.joinDate, emp.salary, emp.advance
      ])
    ].map(row => row.join(',')).join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Export Successful",
      description: "Employee data has been exported to CSV file.",
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

  const handleEditEmployee = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee) {
      setSelectedEmployee(employee);
      setEditFormData({
        name: employee.name,
        phone: employee.phone,
        position: employee.position,
        site: employee.site,
        status: employee.status,
        salary: employee.salary.toString()
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

  const handleSaveEdit = () => {
    toast({
      title: "Employee Updated",
      description: `${editFormData.name} has been updated successfully.`,
    });
    setEditDialogOpen(false);
    setSelectedEmployee(null);
  };

  const confirmDelete = () => {
    if (selectedEmployee) {
      toast({
        title: "Employee Deleted",
        description: `${selectedEmployee.name} has been removed from the system.`,
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
      setSelectedEmployee(null);
    }
  };

  const handleAddEmployee = () => {
    toast({
      title: "Add Employee",
      description: "Employee form would open here in a real implementation.",
    });
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
                placeholder="Search employees by name, ID, or site..."
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
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="On Leave">On Leave</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
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
                        <p className="text-sm text-muted-foreground">{employee.id} • {employee.position}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="flex items-center text-xs text-muted-foreground">
                            <Phone className="h-3 w-3 mr-1" />
                            {employee.phone}
                          </span>
                          <span className="flex items-center text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 mr-1" />
                            {employee.site}
                          </span>
                          <span className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            Joined {employee.joinDate}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium text-foreground">₹{employee.salary.toLocaleString()}</p>
                        {employee.advance > 0 && (
                          <p className="text-xs text-business-warning">Advance: ₹{employee.advance}</p>
                        )}
                      </div>
                      <Badge className={getStatusColor(employee.status)}>
                        {employee.status}
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cards" className="space-y-4">
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
                      {employee.status}
                    </Badge>
                  </div>
                  <CardDescription>{employee.position}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <User className="h-4 w-4 mr-2 text-muted-foreground" />
                      {employee.id}
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      {employee.phone}
                    </div>
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      {employee.site}
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Monthly Salary</span>
                      <span className="font-semibold">₹{employee.salary.toLocaleString()}</span>
                    </div>
                    {employee.advance > 0 && (
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-business-warning">Advance Given</span>
                        <span className="text-sm text-business-warning">₹{employee.advance}</span>
                      </div>
                    )}
                   </div>
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
        </TabsContent>
      </Tabs>

      {/* Edit Employee Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>
              Make changes to {selectedEmployee?.name}'s information here.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input
                id="name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">Phone</Label>
              <Input
                id="phone"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="position" className="text-right">Position</Label>
              <Input
                id="position"
                value={editFormData.position}
                onChange={(e) => setEditFormData({...editFormData, position: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="site" className="text-right">Site</Label>
              <Input
                id="site"
                value={editFormData.site}
                onChange={(e) => setEditFormData({...editFormData, site: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">Status</Label>
              <Select value={editFormData.status} onValueChange={(value) => setEditFormData({...editFormData, status: value})}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="On Leave">On Leave</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="salary" className="text-right">Salary</Label>
              <Input
                id="salary"
                type="number"
                value={editFormData.salary}
                onChange={(e) => setEditFormData({...editFormData, salary: e.target.value})}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedEmployee?.name}</strong>? 
              This action cannot be undone and will permanently remove their record from the system.
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
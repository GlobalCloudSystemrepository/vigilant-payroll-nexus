import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, Plus, Edit, Trash2, Building2, UserCheck
} from "lucide-react";

interface Department {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Designation {
  id: string;
  department_id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  departments?: {
    name: string;
  };
}

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  
  // Dialog states
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false);
  const [designationDialogOpen, setDesignationDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [deleteType, setDeleteType] = useState<'department' | 'designation'>('department');
  
  // Form data
  const [departmentFormData, setDepartmentFormData] = useState({
    name: "",
    description: "",
    status: "active"
  });
  
  const [designationFormData, setDesignationFormData] = useState({
    department_id: "",
    name: "",
    description: "",
    status: "active"
  });
  
  const [editMode, setEditMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDepartments();
    fetchDesignations();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch departments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDesignations = async () => {
    try {
      const { data, error } = await supabase
        .from('designations')
        .select(`
          *,
          departments(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData = data?.map(item => ({
        ...item,
        departments: Array.isArray(item.departments) && item.departments.length > 0 
          ? item.departments[0] 
          : { name: 'Unknown Department' }
      })) || [];
      
      setDesignations(transformedData);
    } catch (error) {
      console.error('Error fetching designations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch designations",
        variant: "destructive",
      });
    }
  };

  // Filter functions
  const filteredDepartments = departments.filter(dept => {
    const matchesSearch = dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || dept.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredDesignations = designations.filter(designation => {
    const matchesSearch = designation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (designation.description && designation.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || designation.status === statusFilter;
    const matchesDepartment = selectedDepartment === "all" || designation.department_id === selectedDepartment;
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  // CRUD operations for departments
  const handleAddDepartment = () => {
    setDepartmentFormData({
      name: "",
      description: "",
      status: "active"
    });
    setEditMode(false);
    setDepartmentDialogOpen(true);
  };

  const handleEditDepartment = (department: Department) => {
    setDepartmentFormData({
      name: department.name,
      description: department.description || "",
      status: department.status
    });
    setSelectedItem(department);
    setEditMode(true);
    setDepartmentDialogOpen(true);
  };

  const handleSaveDepartment = async () => {
    try {
      if (editMode && selectedItem) {
        const { error } = await supabase
          .from('departments')
          .update(departmentFormData)
          .eq('id', selectedItem.id);

        if (error) throw error;

        toast({
          title: "Department Updated",
          description: `${departmentFormData.name} has been updated successfully.`,
        });
      } else {
        const { error } = await supabase
          .from('departments')
          .insert(departmentFormData);

        if (error) throw error;

        toast({
          title: "Department Added",
          description: `${departmentFormData.name} has been added successfully.`,
        });
      }

      setDepartmentDialogOpen(false);
      setSelectedItem(null);
      fetchDepartments();
    } catch (error) {
      console.error('Error saving department:', error);
      toast({
        title: "Error",
        description: "Failed to save department",
        variant: "destructive",
      });
    }
  };

  // CRUD operations for designations
  const handleAddDesignation = () => {
    setDesignationFormData({
      department_id: "",
      name: "",
      description: "",
      status: "active"
    });
    setEditMode(false);
    setDesignationDialogOpen(true);
  };

  const handleEditDesignation = (designation: Designation) => {
    setDesignationFormData({
      department_id: designation.department_id,
      name: designation.name,
      description: designation.description || "",
      status: designation.status
    });
    setSelectedItem(designation);
    setEditMode(true);
    setDesignationDialogOpen(true);
  };

  const handleSaveDesignation = async () => {
    try {
      if (editMode && selectedItem) {
        const { error } = await supabase
          .from('designations')
          .update(designationFormData)
          .eq('id', selectedItem.id);

        if (error) throw error;

        toast({
          title: "Designation Updated",
          description: `${designationFormData.name} has been updated successfully.`,
        });
      } else {
        const { error } = await supabase
          .from('designations')
          .insert(designationFormData);

        if (error) throw error;

        toast({
          title: "Designation Added",
          description: `${designationFormData.name} has been added successfully.`,
        });
      }

      setDesignationDialogOpen(false);
      setSelectedItem(null);
      fetchDesignations();
    } catch (error) {
      console.error('Error saving designation:', error);
      toast({
        title: "Error",
        description: "Failed to save designation",
        variant: "destructive",
      });
    }
  };

  // Delete operations
  const handleDelete = (item: any, type: 'department' | 'designation') => {
    setSelectedItem(item);
    setDeleteType(type);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const table = deleteType === 'department' ? 'departments' : 'designations';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', selectedItem.id);

      if (error) throw error;

      toast({
        title: `${deleteType === 'department' ? 'Department' : 'Designation'} Deleted`,
        description: `${selectedItem.name} has been removed from the system.`,
      });

      setDeleteDialogOpen(false);
      setSelectedItem(null);
      
      if (deleteType === 'department') {
        fetchDepartments();
        fetchDesignations(); // Refresh designations as they might be affected
      } else {
        fetchDesignations();
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: `Failed to delete ${deleteType}`,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-business-success text-white";
      case "inactive": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Departments & Designations</h1>
          <p className="text-muted-foreground">Manage organizational structure and job roles</p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search departments or designations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Departments and Designations */}
      <Tabs defaultValue="departments" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="designations">Designations</TabsTrigger>
        </TabsList>

        {/* Departments Tab */}
        <TabsContent value="departments" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Departments</h2>
            <Button onClick={handleAddDepartment}>
              <Plus className="h-4 w-4 mr-2" />
              Add Department
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDepartments.map((department) => (
              <Card key={department.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center">
                      <Building2 className="h-5 w-5 mr-2 text-primary" />
                      {department.name}
                    </CardTitle>
                    <Badge className={getStatusColor(department.status)}>
                      {department.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-4">
                    {department.description || 'No description provided'}
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditDepartment(department)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(department, 'department')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Designations Tab */}
        <TabsContent value="designations" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">Designations</h2>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddDesignation}>
              <Plus className="h-4 w-4 mr-2" />
              Add Designation
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDesignations.map((designation) => (
              <Card key={designation.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center">
                      <UserCheck className="h-5 w-5 mr-2 text-primary" />
                      {designation.name}
                    </CardTitle>
                    <Badge className={getStatusColor(designation.status)}>
                      {designation.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {designation.departments?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-4">
                    {designation.description || 'No description provided'}
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditDesignation(designation)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(designation, 'designation')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Department Dialog */}
      <Dialog open={departmentDialogOpen} onOpenChange={setDepartmentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editMode ? 'Edit Department' : 'Add New Department'}</DialogTitle>
            <DialogDescription>
              {editMode ? 'Update the department details.' : 'Enter the department details to add it to the system.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="dept-name">Department Name *</Label>
              <Input
                id="dept-name"
                value={departmentFormData.name}
                onChange={(e) => setDepartmentFormData(prev => ({...prev, name: e.target.value}))}
                placeholder="e.g., Security Department"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dept-description">Description</Label>
              <Textarea
                id="dept-description"
                value={departmentFormData.description}
                onChange={(e) => setDepartmentFormData(prev => ({...prev, description: e.target.value}))}
                placeholder="Brief description of the department"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dept-status">Status</Label>
              <Select 
                value={departmentFormData.status} 
                onValueChange={(value) => setDepartmentFormData(prev => ({...prev, status: value}))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDepartmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDepartment} disabled={!departmentFormData.name}>
              {editMode ? 'Update' : 'Add'} Department
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Designation Dialog */}
      <Dialog open={designationDialogOpen} onOpenChange={setDesignationDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editMode ? 'Edit Designation' : 'Add New Designation'}</DialogTitle>
            <DialogDescription>
              {editMode ? 'Update the designation details.' : 'Enter the designation details to add it to the system.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="desig-department">Department *</Label>
              <Select 
                value={designationFormData.department_id} 
                onValueChange={(value) => setDesignationFormData(prev => ({...prev, department_id: value}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.filter(d => d.status === 'active').map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="desig-name">Designation Name *</Label>
              <Input
                id="desig-name"
                value={designationFormData.name}
                onChange={(e) => setDesignationFormData(prev => ({...prev, name: e.target.value}))}
                placeholder="e.g., Security Guard"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="desig-description">Description</Label>
              <Textarea
                id="desig-description"
                value={designationFormData.description}
                onChange={(e) => setDesignationFormData(prev => ({...prev, description: e.target.value}))}
                placeholder="Brief description of the designation"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="desig-status">Status</Label>
              <Select 
                value={designationFormData.status} 
                onValueChange={(value) => setDesignationFormData(prev => ({...prev, status: value}))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDesignationDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveDesignation} 
              disabled={!designationFormData.name || !designationFormData.department_id}
            >
              {editMode ? 'Update' : 'Add'} Designation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {deleteType} 
              "{selectedItem?.name}" and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
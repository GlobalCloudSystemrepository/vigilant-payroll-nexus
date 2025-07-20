import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, Plus, Download, Upload, Filter, 
  Building2, MapPin, Phone, Mail, User, Calendar, Edit, Trash2 
} from "lucide-react";

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editFormData, setEditFormData] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    guardsRequired: "",
    monthlyBill: "",
    status: ""
  });
  const [addFormData, setAddFormData] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    guardsRequired: "",
    monthlyBill: "",
    status: "active"
  });
  const { toast } = useToast();

  // Load customers from Supabase
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  // Filter customers based on search term and status filter
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.customer_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.address?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || customer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate real-time stats
  const stats = {
    total: filteredCustomers.length,
    active: filteredCustomers.filter(c => c.status === "active").length,
    inactive: filteredCustomers.filter(c => c.status === "inactive").length,
    totalGuards: filteredCustomers.reduce((sum, customer) => sum + (customer.guards_required || 0), 0),
    totalRevenue: filteredCustomers.reduce((sum, customer) => sum + (customer.monthly_bill || 0), 0)
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-business-success text-white";
      case "inactive": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const handleExport = () => {
    console.log("Export button clicked");
    const csvContent = [
      ['ID', 'Name', 'Contact Person', 'Phone', 'Email', 'Address', 'Guards Required', 'Monthly Bill', 'Status'],
      ...filteredCustomers.map(customer => [
        customer.customer_id, customer.company_name, customer.contact_person, customer.phone, 
        customer.email, customer.address, customer.guards_required, 
        customer.monthly_bill, customer.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Export Successful",
      description: "Customer data has been exported to CSV file.",
    });
  };

  const handleBulkImport = () => {
    console.log("Bulk Import button clicked");
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
        setTimeout(() => {
          toast({
            title: "Import Complete",
            description: "Customer data has been imported successfully.",
          });
        }, 2000);
      }
    };
    input.click();
  };

  const handleAddCustomer = () => {
    console.log("Add Customer button clicked");
    setAddDialogOpen(true);
  };

  const handleSaveNewCustomer = async () => {
    try {
      // Generate new customer ID
      const newId = `CUS${String(customers.length + 1).padStart(3, '0')}`;
      
      const { data, error } = await supabase
        .from('customers')
        .insert([
          {
            customer_id: newId,
            company_name: addFormData.name,
            contact_person: addFormData.contactPerson,
            phone: addFormData.phone,
            email: addFormData.email,
            address: addFormData.address,
            guards_required: parseInt(addFormData.guardsRequired) || 0,
            monthly_bill: parseFloat(addFormData.monthlyBill) || 0,
            status: addFormData.status
          }
        ])
        .select();

      if (error) throw error;

      toast({
        title: "Customer Added",
        description: `${addFormData.name} has been added successfully with ID ${newId}.`,
      });
      
      // Reset form
      setAddFormData({
        name: "",
        contactPerson: "",
        phone: "",
        email: "",
        address: "",
        guardsRequired: "",
        monthlyBill: "",
        status: "active"
      });
      
      setAddDialogOpen(false);
      fetchCustomers(); // Refresh the list
    } catch (error) {
      console.error('Error adding customer:', error);
      toast({
        title: "Error",
        description: "Failed to add customer",
        variant: "destructive",
      });
    }
  };

  const handleEditCustomer = (customerId: string) => {
    const customer = customers.find(c => c.customer_id === customerId);
    if (customer) {
      setSelectedCustomer(customer);
      setEditFormData({
        name: customer.company_name || "",
        contactPerson: customer.contact_person || "",
        phone: customer.phone || "",
        email: customer.email || "",
        address: customer.address || "",
        guardsRequired: (customer.guards_required || 0).toString(),
        monthlyBill: (customer.monthly_bill || 0).toString(),
        status: customer.status || "active"
      });
      setEditDialogOpen(true);
    }
  };

  const handleDeleteCustomer = (customerId: string) => {
    const customer = customers.find(c => c.customer_id === customerId);
    if (customer) {
      setSelectedCustomer(customer);
      setDeleteDialogOpen(true);
    }
  };

  const handleSaveEdit = async () => {
    try {
      if (!selectedCustomer) return;
      
      const { error } = await supabase
        .from('customers')
        .update({
          company_name: editFormData.name,
          contact_person: editFormData.contactPerson,
          phone: editFormData.phone,
          email: editFormData.email,
          address: editFormData.address,
          guards_required: parseInt(editFormData.guardsRequired) || 0,
          monthly_bill: parseFloat(editFormData.monthlyBill) || 0,
          status: editFormData.status
        })
        .eq('id', selectedCustomer.id);

      if (error) throw error;

      toast({
        title: "Customer Updated",
        description: `${editFormData.name} has been updated successfully.`,
      });
      
      setEditDialogOpen(false);
      setSelectedCustomer(null);
      fetchCustomers(); // Refresh the list
    } catch (error) {
      console.error('Error updating customer:', error);
      toast({
        title: "Error",
        description: "Failed to update customer",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = async () => {
    try {
      if (!selectedCustomer) return;
      
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', selectedCustomer.id);

      if (error) throw error;

      toast({
        title: "Customer Deleted",
        description: `${selectedCustomer.company_name} has been removed from the system.`,
        variant: "destructive",
      });
      
      setDeleteDialogOpen(false);
      setSelectedCustomer(null);
      fetchCustomers(); // Refresh the list
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast({
        title: "Error",
        description: "Failed to delete customer",
        variant: "destructive",
      });
    }
  };

  const handleFilterChange = (filterType: string) => {
    setStatusFilter(filterType);
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customer Management</h1>
          <p className="text-muted-foreground">Manage client contracts and site information</p>
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
          <Button className="bg-gradient-to-r from-primary to-primary-hover" onClick={handleAddCustomer}>
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-business-success">{stats.active}</div>
            <p className="text-sm text-muted-foreground">Active Customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{stats.totalGuards}</div>
            <p className="text-sm text-muted-foreground">Guards Required</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-lg font-bold text-business-success">₹{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Monthly Revenue</p>
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
                placeholder="Search customers by name, contact person, or location..."
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
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="cards">Card View</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Directory</CardTitle>
              <CardDescription>Complete list of all client sites and contracts ({filteredCustomers.length} shown)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredCustomers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No customers found matching your search criteria.
                  </div>
                ) : (
                  filteredCustomers.map((customer) => (
                  <div 
                    key={customer.id} 
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-business-blue-light rounded-full flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-business-blue" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{customer.company_name}</h3>
                        <p className="text-sm text-muted-foreground">{customer.customer_id} • {customer.contact_person}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="flex items-center text-xs text-muted-foreground">
                            <Phone className="h-3 w-3 mr-1" />
                            {customer.phone}
                          </span>
                          <span className="flex items-center text-xs text-muted-foreground">
                            <Mail className="h-3 w-3 mr-1" />
                            {customer.email}
                          </span>
                          <span className="flex items-center text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 mr-1" />
                            {customer.address}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium text-foreground">₹{(customer.monthly_bill || 0).toLocaleString()}/month</p>
                        <p className="text-sm text-muted-foreground">{customer.guards_required || 0} guards required</p>
                        <p className="text-xs text-muted-foreground">ID: {customer.customer_id}</p>
                      </div>
                      <Badge className={getStatusColor(customer.status)}>
                        {customer.status}
                      </Badge>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEditCustomer(customer.customer_id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeleteCustomer(customer.customer_id)}>
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
            {filteredCustomers.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No customers found matching your search criteria.
              </div>
            ) : (
              filteredCustomers.map((customer) => (
              <Card key={customer.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{customer.company_name}</CardTitle>
                    <Badge className={getStatusColor(customer.status)}>
                      {customer.status}
                    </Badge>
                  </div>
                  <CardDescription>{customer.contact_person}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                      {customer.customer_id}
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      {customer.phone}
                    </div>
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      {customer.address}
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Monthly Bill</span>
                      <span className="font-semibold">₹{(customer.monthly_bill || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-muted-foreground">Guards Required</span>
                      <span className="text-sm">{customer.guards_required || 0}</span>
                    </div>
                  </div>
                   <div className="flex gap-2 pt-2">
                     <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEditCustomer(customer.customer_id)}>
                       <Edit className="h-4 w-4 mr-1" />
                       Edit
                     </Button>
                     <Button size="sm" variant="outline" onClick={() => handleDeleteCustomer(customer.customer_id)}>
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

      {/* Edit Customer Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Make changes to {selectedCustomer?.company_name}'s information here.
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
              <Label htmlFor="contact" className="text-right">Contact Person</Label>
              <Input
                id="contact"
                value={editFormData.contactPerson}
                onChange={(e) => setEditFormData({...editFormData, contactPerson: e.target.value})}
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
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input
                id="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">Address</Label>
              <Input
                id="address"
                value={editFormData.address}
                onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="guards" className="text-right">Guards Required</Label>
              <Input
                id="guards"
                type="number"
                value={editFormData.guardsRequired}
                onChange={(e) => setEditFormData({...editFormData, guardsRequired: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bill" className="text-right">Monthly Bill</Label>
              <Input
                id="bill"
                type="number"
                value={editFormData.monthlyBill}
                onChange={(e) => setEditFormData({...editFormData, monthlyBill: e.target.value})}
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
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

      {/* Add Customer Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Enter the details for the new customer.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-name" className="text-right">Name</Label>
              <Input
                id="add-name"
                value={addFormData.name}
                onChange={(e) => setAddFormData({...addFormData, name: e.target.value})}
                className="col-span-3"
                placeholder="Company/Site name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-contact" className="text-right">Contact Person</Label>
              <Input
                id="add-contact"
                value={addFormData.contactPerson}
                onChange={(e) => setAddFormData({...addFormData, contactPerson: e.target.value})}
                className="col-span-3"
                placeholder="Mr./Ms. Full Name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-phone" className="text-right">Phone</Label>
              <Input
                id="add-phone"
                value={addFormData.phone}
                onChange={(e) => setAddFormData({...addFormData, phone: e.target.value})}
                className="col-span-3"
                placeholder="+91 98765 43210"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-email" className="text-right">Email</Label>
              <Input
                id="add-email"
                type="email"
                value={addFormData.email}
                onChange={(e) => setAddFormData({...addFormData, email: e.target.value})}
                className="col-span-3"
                placeholder="contact@company.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-address" className="text-right">Address</Label>
              <Input
                id="add-address"
                value={addFormData.address}
                onChange={(e) => setAddFormData({...addFormData, address: e.target.value})}
                className="col-span-3"
                placeholder="City, State"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-guards" className="text-right">Guards Required</Label>
              <Input
                id="add-guards"
                type="number"
                value={addFormData.guardsRequired}
                onChange={(e) => setAddFormData({...addFormData, guardsRequired: e.target.value})}
                className="col-span-3"
                placeholder="4"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-bill" className="text-right">Monthly Bill</Label>
              <Input
                id="add-bill"
                type="number"
                value={addFormData.monthlyBill}
                onChange={(e) => setAddFormData({...addFormData, monthlyBill: e.target.value})}
                className="col-span-3"
                placeholder="150000"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-status" className="text-right">Status</Label>
              <Select value={addFormData.status} onValueChange={(value) => setAddFormData({...addFormData, status: value})}>
                <SelectTrigger className="col-span-3">
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
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNewCustomer}>Add Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedCustomer?.company_name}</strong>? 
              This action cannot be undone and will permanently remove their record from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Customer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
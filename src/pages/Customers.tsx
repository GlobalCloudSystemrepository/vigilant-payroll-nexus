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
  Building2, MapPin, Phone, Mail, User, Calendar, Edit, Trash2 
} from "lucide-react";

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
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
  const { toast } = useToast();

  const customers = [
    {
      id: "CUS001",
      name: "Alpha Corporate Tower",
      contactPerson: "Mr. Rajesh Kumar",
      phone: "+91 98765 43210",
      email: "rajesh@alphacorp.com",
      address: "Sector 62, Noida",
      contractStart: "2023-01-01",
      contractEnd: "2024-12-31",
      guardsRequired: 6,
      guardsAssigned: 6,
      monthlyBill: 180000,
      status: "Active"
    },
    {
      id: "CUS002", 
      name: "Beta Shopping Mall",
      contactPerson: "Ms. Priya Sharma",
      phone: "+91 98765 43211",
      email: "priya@betamall.com",
      address: "MG Road, Bangalore",
      contractStart: "2023-03-15",
      contractEnd: "2025-03-14",
      guardsRequired: 8,
      guardsAssigned: 8,
      monthlyBill: 240000,
      status: "Active"
    },
    {
      id: "CUS003",
      name: "Gamma Residential Complex",
      contactPerson: "Mr. Amit Patel",
      phone: "+91 98765 43212",
      email: "amit@gammaresidences.com",
      address: "Bandra West, Mumbai",
      contractStart: "2022-06-01",
      contractEnd: "2024-05-31",
      guardsRequired: 4,
      guardsAssigned: 3,
      monthlyBill: 120000,
      status: "Understaffed"
    },
    {
      id: "CUS004",
      name: "Delta Office Complex",
      contactPerson: "Ms. Sunita Reddy",
      phone: "+91 98765 43213",
      email: "sunita@deltaoffices.com",
      address: "Hitech City, Hyderabad",
      contractStart: "2024-01-01",
      contractEnd: "2026-12-31",
      guardsRequired: 5,
      guardsAssigned: 5,
      monthlyBill: 150000,
      status: "Active"
    }
  ];

  // Filter customers based on search term and status filter
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || customer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate real-time stats
  const stats = {
    total: filteredCustomers.length,
    active: filteredCustomers.filter(c => c.status === "Active").length,
    understaffed: filteredCustomers.filter(c => c.status === "Understaffed").length,
    totalGuards: filteredCustomers.reduce((sum, customer) => sum + customer.guardsAssigned, 0),
    totalRevenue: filteredCustomers.reduce((sum, customer) => sum + customer.monthlyBill, 0)
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-business-success text-white";
      case "Understaffed": return "bg-business-warning text-white";
      case "Contract Expired": return "bg-destructive text-white";
      case "Inactive": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const handleExport = () => {
    console.log("Export button clicked");
    const csvContent = [
      ['ID', 'Name', 'Contact Person', 'Phone', 'Email', 'Address', 'Guards Required', 'Guards Assigned', 'Monthly Bill', 'Status'],
      ...filteredCustomers.map(customer => [
        customer.id, customer.name, customer.contactPerson, customer.phone, 
        customer.email, customer.address, customer.guardsRequired, 
        customer.guardsAssigned, customer.monthlyBill, customer.status
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
    toast({
      title: "Add Customer",
      description: "Customer form would open here in a real implementation.",
    });
  };

  const handleEditCustomer = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setSelectedCustomer(customer);
      setEditFormData({
        name: customer.name,
        contactPerson: customer.contactPerson,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        guardsRequired: customer.guardsRequired.toString(),
        monthlyBill: customer.monthlyBill.toString(),
        status: customer.status
      });
      setEditDialogOpen(true);
    }
  };

  const handleDeleteCustomer = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setSelectedCustomer(customer);
      setDeleteDialogOpen(true);
    }
  };

  const handleSaveEdit = () => {
    toast({
      title: "Customer Updated",
      description: `${editFormData.name} has been updated successfully.`,
    });
    setEditDialogOpen(false);
    setSelectedCustomer(null);
  };

  const confirmDelete = () => {
    if (selectedCustomer) {
      toast({
        title: "Customer Deleted",
        description: `${selectedCustomer.name} has been removed from the system.`,
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
      setSelectedCustomer(null);
    }
  };

  const handleFilterChange = (filterType: string) => {
    setStatusFilter(filterType);
  };

  const totalRevenue = customers.reduce((sum, customer) => sum + customer.monthlyBill, 0);
  const activeCustomers = customers.filter(c => c.status === "Active").length;
  const totalGuardsDeployed = customers.reduce((sum, customer) => sum + customer.guardsAssigned, 0);

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
            <p className="text-sm text-muted-foreground">Active Contracts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{stats.totalGuards}</div>
            <p className="text-sm text-muted-foreground">Guards Deployed</p>
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
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Understaffed">Understaffed</SelectItem>
                <SelectItem value="Contract Expired">Contract Expired</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
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
                        <h3 className="font-semibold text-foreground">{customer.name}</h3>
                        <p className="text-sm text-muted-foreground">{customer.id} • {customer.contactPerson}</p>
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
                        <p className="font-medium text-foreground">₹{customer.monthlyBill.toLocaleString()}/month</p>
                        <p className="text-sm text-muted-foreground">{customer.guardsAssigned}/{customer.guardsRequired} guards</p>
                        <p className="text-xs text-muted-foreground">Contract: {customer.contractEnd}</p>
                      </div>
                      <Badge className={getStatusColor(customer.status)}>
                        {customer.status}
                      </Badge>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEditCustomer(customer.id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeleteCustomer(customer.id)}>
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
                    <CardTitle className="text-lg">{customer.name}</CardTitle>
                    <Badge className={getStatusColor(customer.status)}>
                      {customer.status}
                    </Badge>
                  </div>
                  <CardDescription>{customer.contactPerson}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                      {customer.id}
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      {customer.phone}
                    </div>
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      {customer.address}
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      Until {customer.contractEnd}
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Monthly Bill</span>
                      <span className="font-semibold">₹{customer.monthlyBill.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-muted-foreground">Guards</span>
                      <span className="text-sm">{customer.guardsAssigned}/{customer.guardsRequired}</span>
                    </div>
                  </div>
                   <div className="flex gap-2 pt-2">
                     <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEditCustomer(customer.id)}>
                       <Edit className="h-4 w-4 mr-1" />
                       Edit
                     </Button>
                     <Button size="sm" variant="outline" onClick={() => handleDeleteCustomer(customer.id)}>
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
              Make changes to {selectedCustomer?.name}'s information here.
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
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Understaffed">Understaffed</SelectItem>
                  <SelectItem value="Contract Expired">Contract Expired</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedCustomer?.name}</strong>? 
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
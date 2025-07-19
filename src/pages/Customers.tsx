import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, Plus, Download, Upload, Filter, 
  Building2, MapPin, Phone, Mail, User, Calendar, Edit, Trash2 
} from "lucide-react";

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-business-success text-white";
      case "Understaffed": return "bg-business-warning text-white";
      case "Contract Expired": return "bg-destructive text-white";
      case "Inactive": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
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
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </Button>
          <Button className="bg-gradient-to-r from-primary to-primary-hover">
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">{customers.length}</div>
            <p className="text-sm text-muted-foreground">Total Customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-business-success">{activeCustomers}</div>
            <p className="text-sm text-muted-foreground">Active Contracts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{totalGuardsDeployed}</div>
            <p className="text-sm text-muted-foreground">Guards Deployed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-lg font-bold text-business-success">₹{totalRevenue.toLocaleString()}</div>
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
              <CardDescription>Complete list of all client sites and contracts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customers.map((customer) => (
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
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cards" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customers.map((customer) => (
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
                    <Button size="sm" variant="outline" className="flex-1">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
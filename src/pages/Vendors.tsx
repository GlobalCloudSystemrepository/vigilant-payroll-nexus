import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, Plus, Download, Upload, Filter, 
  Shield, Phone, MapPin, User, Star, Calendar, Edit, Trash2, CreditCard 
} from "lucide-react";

export default function Vendors() {
  const [searchTerm, setSearchTerm] = useState("");

  const vendors = [
    {
      id: "VEN001",
      name: "QuickGuard Services",
      contactPerson: "Mr. Vikram Singh",
      phone: "+91 98765 43220",
      email: "vikram@quickguard.com",
      address: "Defence Colony, Delhi",
      guardsAvailable: 15,
      dailyRate: 800,
      rating: 4.8,
      totalPayments: 350000,
      lastPayment: "2024-01-10",
      status: "Active"
    },
    {
      id: "VEN002", 
      name: "Elite Security Solutions",
      contactPerson: "Ms. Kavita Joshi",
      phone: "+91 98765 43221",
      email: "kavita@elitesecurity.com",
      address: "Powai, Mumbai",
      guardsAvailable: 20,
      dailyRate: 750,
      rating: 4.6,
      totalPayments: 280000,
      lastPayment: "2024-01-08",
      status: "Active"
    },
    {
      id: "VEN003",
      name: "Reliable Guard Services",
      contactPerson: "Mr. Suresh Kumar",
      phone: "+91 98765 43222",
      email: "suresh@reliableguards.com",
      address: "Koramangala, Bangalore",
      guardsAvailable: 12,
      dailyRate: 700,
      rating: 4.2,
      totalPayments: 180000,
      lastPayment: "2024-01-12",
      status: "Active"
    },
    {
      id: "VEN004",
      name: "Metro Security Partners",
      contactPerson: "Ms. Anita Mehta",
      phone: "+91 98765 43223",
      email: "anita@metrosecurity.com",
      address: "Banjara Hills, Hyderabad",
      guardsAvailable: 8,
      dailyRate: 720,
      rating: 3.9,
      totalPayments: 95000,
      lastPayment: "2024-01-05",
      status: "Payment Due"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-business-success text-white";
      case "Payment Due": return "bg-business-warning text-white";
      case "Inactive": return "bg-muted text-muted-foreground";
      case "Blacklisted": return "bg-destructive text-white";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-business-success";
    if (rating >= 4.0) return "text-business-warning";
    return "text-destructive";
  };

  const totalVendors = vendors.length;
  const activeVendors = vendors.filter(v => v.status === "Active").length;
  const totalGuardsPool = vendors.reduce((sum, vendor) => sum + vendor.guardsAvailable, 0);
  const totalPayments = vendors.reduce((sum, vendor) => sum + vendor.totalPayments, 0);

  const recentAssignments = [
    { vendor: "QuickGuard Services", guards: 3, site: "Alpha Corporate", date: "Today", amount: 2400 },
    { vendor: "Elite Security Solutions", guards: 2, site: "Beta Mall", date: "Yesterday", amount: 1500 },
    { vendor: "Reliable Guard Services", guards: 1, site: "Gamma Residential", date: "2 days ago", amount: 700 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Vendor Management</h1>
          <p className="text-muted-foreground">Manage relief guard service providers</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <CreditCard className="h-4 w-4 mr-2" />
            Process Payments
          </Button>
          <Button className="bg-gradient-to-r from-primary to-primary-hover">
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">{totalVendors}</div>
            <p className="text-sm text-muted-foreground">Total Vendors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-business-success">{activeVendors}</div>
            <p className="text-sm text-muted-foreground">Active Partners</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{totalGuardsPool}</div>
            <p className="text-sm text-muted-foreground">Guards Available</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-lg font-bold text-business-success">₹{totalPayments.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Total Payments</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Assignments */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Assignments</CardTitle>
            <CardDescription>Latest vendor guard deployments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentAssignments.map((assignment, index) => (
              <div key={index} className="p-3 rounded-lg bg-muted/30">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{assignment.vendor}</p>
                    <p className="text-xs text-muted-foreground">{assignment.guards} guards → {assignment.site}</p>
                    <p className="text-xs text-muted-foreground">{assignment.date}</p>
                  </div>
                  <p className="font-semibold text-sm">₹{assignment.amount}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Vendor Directory */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Directory</CardTitle>
              <CardDescription>Relief guard service providers</CardDescription>
              <div className="flex gap-4 items-center pt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search vendors by name or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vendors.map((vendor) => (
                  <div 
                    key={vendor.id} 
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-business-blue-light rounded-full flex items-center justify-center">
                        <Shield className="h-6 w-6 text-business-blue" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{vendor.name}</h3>
                        <p className="text-sm text-muted-foreground">{vendor.id} • {vendor.contactPerson}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="flex items-center text-xs text-muted-foreground">
                            <Phone className="h-3 w-3 mr-1" />
                            {vendor.phone}
                          </span>
                          <span className="flex items-center text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 mr-1" />
                            {vendor.address}
                          </span>
                          <span className="flex items-center text-xs">
                            <Star className={`h-3 w-3 mr-1 ${getRatingColor(vendor.rating)}`} />
                            <span className={getRatingColor(vendor.rating)}>{vendor.rating}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium text-foreground">₹{vendor.dailyRate}/day</p>
                        <p className="text-sm text-muted-foreground">{vendor.guardsAvailable} guards available</p>
                        <p className="text-xs text-muted-foreground">Last paid: {vendor.lastPayment}</p>
                      </div>
                      <Badge className={getStatusColor(vendor.status)}>
                        {vendor.status}
                      </Badge>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <CreditCard className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
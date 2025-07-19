import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  UserCheck, UserX, Clock, MapPin, 
  CheckCircle, XCircle, AlertTriangle 
} from "lucide-react";

export default function Attendance() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const todayAttendance = [
    {
      id: "EMP001",
      name: "John Smith",
      site: "Alpha Corporate",
      checkIn: "08:00 AM",
      checkOut: "08:00 PM",
      status: "Present",
      hours: "12:00"
    },
    {
      id: "EMP002", 
      name: "Sarah Wilson",
      site: "Beta Shopping Mall",
      checkIn: "07:45 AM",
      checkOut: "07:45 PM",
      status: "Present",
      hours: "12:00"
    },
    {
      id: "EMP003",
      name: "Mike Johnson",
      site: "Gamma Residential", 
      checkIn: "08:30 AM",
      checkOut: "-",
      status: "Late",
      hours: "In Progress"
    },
    {
      id: "EMP004",
      name: "David Brown",
      site: "Delta Office Complex",
      checkIn: "-",
      checkOut: "-", 
      status: "Absent",
      hours: "0:00"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Present": return <CheckCircle className="h-4 w-4 text-business-success" />;
      case "Late": return <AlertTriangle className="h-4 w-4 text-business-warning" />;
      case "Absent": return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Present": return "bg-business-success text-white";
      case "Late": return "bg-business-warning text-white";
      case "Absent": return "bg-destructive text-white";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Attendance Management</h1>
          <p className="text-muted-foreground">Track daily attendance and working hours</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <UserCheck className="h-4 w-4 mr-2" />
            Bulk Check-in
          </Button>
          <Button className="bg-gradient-to-r from-primary to-primary-hover">
            <UserX className="h-4 w-4 mr-2" />
            Mark Attendance
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-business-success" />
              <div>
                <div className="text-2xl font-bold text-business-success">95</div>
                <p className="text-sm text-muted-foreground">Present Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-business-warning" />
              <div>
                <div className="text-2xl font-bold text-business-warning">8</div>
                <p className="text-sm text-muted-foreground">Late Arrivals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <div>
                <div className="text-2xl font-bold text-destructive">5</div>
                <p className="text-sm text-muted-foreground">Absent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold text-primary">95.2%</div>
                <p className="text-sm text-muted-foreground">Attendance Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Calendar</CardTitle>
            <CardDescription>Select date to view attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Today's Attendance */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="today" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="weekly">This Week</TabsTrigger>
              <TabsTrigger value="monthly">This Month</TabsTrigger>
            </TabsList>

            <TabsContent value="today" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Today's Attendance</CardTitle>
                  <CardDescription>
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {todayAttendance.map((record) => (
                      <div 
                        key={record.id}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            {getStatusIcon(record.status)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{record.name}</h3>
                            <p className="text-sm text-muted-foreground">{record.id}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{record.site}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="flex gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Check In</p>
                                <p className="font-medium">{record.checkIn}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Check Out</p>
                                <p className="font-medium">{record.checkOut}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Hours</p>
                                <p className="font-medium">{record.hours}</p>
                              </div>
                            </div>
                          </div>
                          <Badge className={getStatusColor(record.status)}>
                            {record.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="weekly">
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Overview</CardTitle>
                  <CardDescription>Attendance summary for this week</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Weekly attendance analytics will be displayed here.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="monthly">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Overview</CardTitle>
                  <CardDescription>Attendance summary for this month</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Monthly attendance analytics will be displayed here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
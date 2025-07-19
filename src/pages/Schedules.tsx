import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar as CalendarIcon, Copy, Plus, Edit, 
  Clock, MapPin, User, Users, RotateCcw 
} from "lucide-react";

export default function Schedules() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const scheduleTemplates = [
    {
      id: "TEMP001",
      name: "Standard 12-Hour Shift",
      description: "Regular day/night rotation",
      shiftDuration: "12 hours",
      guardsRequired: 2,
      timings: "8:00 AM - 8:00 PM",
      usageCount: 25
    },
    {
      id: "TEMP002",
      name: "24-Hour Coverage",
      description: "Continuous security coverage",
      shiftDuration: "8 hours",
      guardsRequired: 3,
      timings: "3 shifts rotation",
      usageCount: 15
    },
    {
      id: "TEMP003",
      name: "Weekend Special",
      description: "Enhanced weekend security",
      shiftDuration: "10 hours",
      guardsRequired: 3,
      timings: "8:00 AM - 6:00 PM",
      usageCount: 8
    }
  ];

  const todaySchedule = [
    {
      site: "Alpha Corporate Tower",
      shift: "Day Shift",
      time: "8:00 AM - 8:00 PM",
      guards: [
        { name: "John Smith", status: "Present" },
        { name: "Mike Johnson", status: "Present" }
      ],
      supervisor: "Sarah Wilson",
      status: "Active"
    },
    {
      site: "Beta Shopping Mall",
      shift: "Day Shift", 
      time: "8:00 AM - 8:00 PM",
      guards: [
        { name: "David Brown", status: "Present" },
        { name: "Lisa Chen", status: "Late" },
        { name: "Tom Wilson", status: "Present" }
      ],
      supervisor: "James Kumar",
      status: "Active"
    },
    {
      site: "Gamma Residential",
      shift: "Night Shift",
      time: "8:00 PM - 8:00 AM",
      guards: [
        { name: "Robert Lee", status: "Scheduled" },
        { name: "Maria Garcia", status: "Scheduled" }
      ],
      supervisor: "Alex Rodriguez",
      status: "Scheduled"
    }
  ];

  const upcomingChanges = [
    {
      date: "Tomorrow",
      site: "Alpha Corporate",
      change: "Additional guard required for event",
      type: "Temporary"
    },
    {
      date: "Next Week",
      site: "Delta Office Complex",
      change: "New shift pattern implementation",
      type: "Permanent"
    },
    {
      date: "Next Month",
      site: "Beta Shopping Mall",
      change: "Contract renewal - schedule review",
      type: "Review"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Present":
      case "Active": return "bg-business-success text-white";
      case "Late": return "bg-business-warning text-white";
      case "Absent": return "bg-destructive text-white";
      case "Scheduled": return "bg-primary text-white";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case "Temporary": return "bg-business-warning text-white";
      case "Permanent": return "bg-primary text-white";
      case "Review": return "bg-business-blue text-white";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Schedule Management</h1>
          <p className="text-muted-foreground">Plan and manage security shift schedules</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Copy className="h-4 w-4 mr-2" />
            Copy Last Month
          </Button>
          <Button variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Use Template
          </Button>
          <Button className="bg-gradient-to-r from-primary to-primary-hover">
            <Plus className="h-4 w-4 mr-2" />
            Create Schedule
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">34</div>
            <p className="text-sm text-muted-foreground">Active Sites</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-business-success">127</div>
            <p className="text-sm text-muted-foreground">Guards Scheduled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">45</div>
            <p className="text-sm text-muted-foreground">Shifts Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-business-warning">3</div>
            <p className="text-sm text-muted-foreground">Schedule Changes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule Calendar</CardTitle>
            <CardDescription>Select date to view/edit</CardDescription>
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

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="today" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="today">Today's Schedule</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming Changes</TabsTrigger>
            </TabsList>

            {/* Today's Schedule */}
            <TabsContent value="today" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Today's Shift Schedule</CardTitle>
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
                    {todaySchedule.map((schedule, index) => (
                      <div 
                        key={index}
                        className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-foreground">{schedule.site}</h3>
                            <p className="text-sm text-muted-foreground">{schedule.shift} • {schedule.time}</p>
                          </div>
                          <Badge className={getStatusColor(schedule.status)}>
                            {schedule.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">Assigned Guards</p>
                            <div className="space-y-1">
                              {schedule.guards.map((guard, guardIndex) => (
                                <div key={guardIndex} className="flex items-center justify-between text-sm">
                                  <span className="flex items-center">
                                    <User className="h-3 w-3 mr-2 text-muted-foreground" />
                                    {guard.name}
                                  </span>
                                  <Badge 
                                    variant="outline"
                                    className={getStatusColor(guard.status)}
                                  >
                                    {guard.status}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">Supervisor</p>
                            <div className="flex items-center text-sm">
                              <Users className="h-3 w-3 mr-2 text-muted-foreground" />
                              {schedule.supervisor}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline">
                            <Copy className="h-4 w-4 mr-1" />
                            Duplicate
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Templates */}
            <TabsContent value="templates" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Schedule Templates</CardTitle>
                  <CardDescription>Reusable shift patterns for efficient scheduling</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {scheduleTemplates.map((template) => (
                      <div 
                        key={template.id}
                        className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-foreground">{template.name}</h3>
                          <Badge variant="outline">{template.usageCount} times used</Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-2 text-muted-foreground" />
                            <span>{template.shiftDuration} • {template.timings}</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="h-3 w-3 mr-2 text-muted-foreground" />
                            <span>{template.guardsRequired} guards required</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" variant="outline" className="flex-1">
                            <Copy className="h-4 w-4 mr-1" />
                            Use Template
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Upcoming Changes */}
            <TabsContent value="upcoming" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Schedule Changes</CardTitle>
                  <CardDescription>Planned modifications and reviews</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingChanges.map((change, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <CalendarIcon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{change.site}</h3>
                            <p className="text-sm text-muted-foreground">{change.change}</p>
                            <p className="text-xs text-muted-foreground">{change.date}</p>
                          </div>
                        </div>
                        <Badge className={getChangeTypeColor(change.type)}>
                          {change.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
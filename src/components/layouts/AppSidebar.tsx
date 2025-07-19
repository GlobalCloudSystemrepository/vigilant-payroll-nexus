import { NavLink, useLocation } from "react-router-dom";
import {
  Building2, Users, UserCheck, DollarSign, Calendar,
  BarChart3, Settings, Shield, PlusCircle, FileText
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  { 
    title: "Dashboard", 
    url: "/", 
    icon: BarChart3,
    description: "Overview & metrics"
  },
  { 
    title: "Employees", 
    url: "/employees", 
    icon: Users,
    description: "Staff management"
  },
  { 
    title: "Customers", 
    url: "/customers", 
    icon: Building2,
    description: "Client records"
  },
  { 
    title: "Vendors", 
    url: "/vendors", 
    icon: Shield,
    description: "Relief guards"
  },
  { 
    title: "Attendance", 
    url: "/attendance", 
    icon: UserCheck,
    description: "Daily tracking"
  },
  { 
    title: "Schedules", 
    url: "/schedules", 
    icon: Calendar,
    description: "Shift planning"
  },
  { 
    title: "Payroll", 
    url: "/payroll", 
    icon: DollarSign,
    description: "Payments & advances"
  },
  { 
    title: "Reports", 
    url: "/reports", 
    icon: FileText,
    description: "Financial reports"
  },
];

const quickActions = [
  { title: "Add Employee", url: "/employees/new", icon: PlusCircle },
  { title: "Mark Attendance", url: "/attendance/today", icon: UserCheck },
  { title: "Process Payment", url: "/payroll/process", icon: DollarSign },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  const getNavClass = (path: string) => {
    const active = isActive(path);
    return `
      group relative w-full justify-start transition-all duration-200
      ${active 
        ? "bg-primary text-primary-foreground shadow-md" 
        : "hover:bg-secondary hover:text-secondary-foreground"
      }
    `;
  };

  return (
    <Sidebar className="border-r border-border bg-card">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="font-bold text-lg text-foreground">SecureGuard</h1>
              <p className="text-xs text-muted-foreground">Management System</p>
            </div>
          )}
        </div>
      </div>

      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="p-0">
                    <NavLink 
                      to={item.url}
                      className={getNavClass(item.url)}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{item.title}</div>
                          <div className="text-xs opacity-70 truncate">{item.description}</div>
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!isCollapsed && (
          <SidebarGroup className="mt-6">
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Quick Actions
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {quickActions.map((action) => (
                  <SidebarMenuItem key={action.title}>
                    <SidebarMenuButton asChild className="p-0">
                      <NavLink 
                        to={action.url}
                        className="w-full justify-start hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <action.icon className="h-4 w-4 shrink-0" />
                        <span className="text-sm">{action.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <div className="p-4 border-t border-border">
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="p-0">
                <NavLink 
                  to="/settings"
                  className={getNavClass("/settings")}
                >
                  <Settings className="h-5 w-5 shrink-0" />
                  {!isCollapsed && <span>Settings</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </div>
    </Sidebar>
  );
}
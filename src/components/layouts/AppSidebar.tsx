
import React from "react";
import { useLocation, Link } from "react-router-dom";
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
} from "@/components/ui/sidebar";
import {
  Users,
  Calendar,
  ClipboardList,
  DollarSign,
  BarChart3,
  Building,
  Truck,
  User,
  Menu,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Employees", href: "/employees", icon: Users },
  { name: "Employee 360", href: "/employee360", icon: User },
  { name: "Customers", href: "/customers", icon: Building },
  { name: "Vendors", href: "/vendors", icon: Truck },
  { name: "Schedules", href: "/schedules", icon: Calendar },
  { name: "Attendance", href: "/attendance", icon: ClipboardList },
  { name: "Payroll", href: "/payroll", icon: DollarSign },
  { name: "Reports", href: "/reports", icon: BarChart3 },
];

const AppSidebar: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <Sidebar>
      <SidebarTrigger className="m-2 self-end" />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild>
                    <Link 
                      to={item.href}
                      className={`flex items-center gap-2 ${
                        pathname === item.href 
                          ? "bg-muted text-primary font-medium" 
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;

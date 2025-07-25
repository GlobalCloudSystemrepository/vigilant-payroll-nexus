import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/Icons";
import {
  Users,
  Calendar,
  ClipboardList,
  DollarSign,
  BarChart3,
  Building,
  Truck,
  User,
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

interface AppSidebarProps {}

const AppSidebar: React.FC<AppSidebarProps> = ({}) => {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="p-0">
          <Icons.menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0">
        <SheetHeader className="pl-5 pb-10 pt-6">
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>
            Navigate through the application using the menu.
          </SheetDescription>
        </SheetHeader>
        <Separator />
        <NavigationMenu>
          <NavigationMenuList className="flex flex-col gap-0.5 p-5 pt-3">
            {navigation.map((item) => (
              <NavigationMenuItem key={item.name}>
                <Link href={item.href} legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      "data-[active]:bg-muted data-[active]:text-foreground flex items-center justify-start gap-2 rounded-md px-3.5 py-2 text-sm font-medium",
                      pathname === item.href
                        ? "bg-muted text-foreground"
                        : "hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    {item.icon && <item.icon className="h-4 w-4" />}
                    <span>{item.name}</span>
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </SheetContent>
    </Sheet>
  );
};

export default AppSidebar;

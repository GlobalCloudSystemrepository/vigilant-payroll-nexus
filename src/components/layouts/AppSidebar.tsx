
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Building2, 
  Truck, 
  Calendar, 
  Clock, 
  DollarSign, 
  FileText,
  User
} from 'lucide-react';

const menuItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/employees', label: 'Employees', icon: Users },
  { href: '/employee360', label: 'Employee 360', icon: User },
  { href: '/customers', label: 'Customers', icon: Building2 },
  { href: '/vendors', label: 'Vendors', icon: Truck },
  { href: '/schedules', label: 'Schedules', icon: Calendar },
  { href: '/attendance', label: 'Attendance', icon: Clock },
  { href: '/payroll', label: 'Payroll', icon: DollarSign },
  { href: '/reports', label: 'Reports', icon: FileText },
];

export default function AppSidebar() {
  const location = useLocation();

  return (
    <div className="w-64 bg-white shadow-md">
      <div className="p-4">
        <h2 className="text-xl font-semibold text-gray-800">Security Management</h2>
      </div>
      <nav className="mt-8">
        <div className="px-2 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`
                  group flex items-center px-2 py-2 text-sm font-medium rounded-md
                  ${isActive 
                    ? 'bg-gray-100 text-gray-900' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon
                  className={`
                    mr-3 h-5 w-5 flex-shrink-0
                    ${isActive ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'}
                  `}
                />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

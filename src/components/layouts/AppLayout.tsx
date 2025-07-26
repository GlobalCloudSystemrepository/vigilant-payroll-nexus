
import React from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import { AppHeader } from './AppHeader';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

export function AppLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <AppHeader />
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

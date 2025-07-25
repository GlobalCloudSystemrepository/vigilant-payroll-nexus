import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import AppLayout from "./components/layouts/AppLayout";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Customers from "./pages/Customers";
import Vendors from "./pages/Vendors";
import Schedules from "./pages/Schedules";
import Attendance from "./pages/Attendance";
import Payroll from "./pages/Payroll";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import { QueryClient } from "@tanstack/react-query";

import Employee360 from "./pages/Employee360";

function App() {
  return (
    <QueryClient>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Index />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="employees" element={<Employees />} />
            <Route path="employee360" element={<Employee360 />} />
            <Route path="customers" element={<Customers />} />
            <Route path="vendors" element={<Vendors />} />
            <Route path="schedules" element={<Schedules />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="payroll" element={<Payroll />} />
            <Route path="reports" element={<Reports />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
        <Toaster />
      </BrowserRouter>
    </QueryClient>
  );
}

export default App;

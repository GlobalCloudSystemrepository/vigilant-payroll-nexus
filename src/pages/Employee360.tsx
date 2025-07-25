
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import EmployeeScheduleTable from '@/components/employee360/EmployeeScheduleTable';
import EmployeeOvertimeTable from '@/components/employee360/EmployeeOvertimeTable';
import EmployeeCashAdvancesTable from '@/components/employee360/EmployeeCashAdvancesTable';

const Employee360 = () => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [employeeIdFilter, setEmployeeIdFilter] = useState<string>('');

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const filteredEmployees = employees?.filter(emp => 
    employeeIdFilter ? emp.employee_id.toLowerCase().includes(employeeIdFilter.toLowerCase()) : true
  );

  const selectedEmployee = employees?.find(emp => emp.id === selectedEmployeeId);

  const handleSearch = () => {
    // Trigger re-fetch of data with current filters
    console.log('Searching with filters:', { selectedEmployeeId, startDate, endDate });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Employee 360</h1>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee-search">Search Employee ID</Label>
              <Input
                id="employee-search"
                placeholder="Enter Employee ID"
                value={employeeIdFilter}
                onChange={(e) => setEmployeeIdFilter(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="employee-select">Select Employee</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  {filteredEmployees?.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} ({employee.employee_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button onClick={handleSearch} className="w-full">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedEmployee && (
        <>
          {/* Employee Info */}
          <Card>
            <CardHeader>
              <CardTitle>Employee Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="font-semibold">Name:</p>
                  <p>{selectedEmployee.name}</p>
                </div>
                <div>
                  <p className="font-semibold">Employee ID:</p>
                  <p>{selectedEmployee.employee_id}</p>
                </div>
                <div>
                  <p className="font-semibold">Position:</p>
                  <p>{selectedEmployee.position || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Schedules */}
          <Card>
            <CardHeader>
              <CardTitle>Current Schedules</CardTitle>
            </CardHeader>
            <CardContent>
              <EmployeeScheduleTable 
                employeeId={selectedEmployeeId}
                startDate={startDate}
                endDate={endDate}
              />
            </CardContent>
          </Card>

          {/* Overtime Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Overtime Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <EmployeeOvertimeTable 
                employeeId={selectedEmployeeId}
                startDate={startDate}
                endDate={endDate}
              />
            </CardContent>
          </Card>

          {/* Cash Advances */}
          <Card>
            <CardHeader>
              <CardTitle>Cash Advances</CardTitle>
            </CardHeader>
            <CardContent>
              <EmployeeCashAdvancesTable 
                employeeId={selectedEmployeeId}
                startDate={startDate}
                endDate={endDate}
              />
            </CardContent>
          </Card>
        </>
      )}

      {!selectedEmployee && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Please select an employee to view their 360 profile</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Employee360;

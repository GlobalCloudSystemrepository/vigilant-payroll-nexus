
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

interface EmployeeOvertimeTableProps {
  employeeId: string;
  startDate: string;
  endDate: string;
}

const EmployeeOvertimeTable = ({ employeeId, startDate, endDate }: EmployeeOvertimeTableProps) => {
  const { data: overtimeData, isLoading } = useQuery({
    queryKey: ['employee-overtime', employeeId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('is_overtime', true)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!employeeId,
  });

  const totalOvertimeHours = overtimeData?.reduce((sum, record) => {
    return sum + (record.hours_worked || 0);
  }, 0) || 0;

  if (isLoading) {
    return <div className="text-center py-4">Loading overtime data...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-900">Total Overtime Hours</h3>
        <p className="text-2xl font-bold text-blue-700">{totalOvertimeHours.toFixed(2)} hours</p>
      </div>

      {overtimeData && overtimeData.length > 0 ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Hours Worked</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overtimeData.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{format(new Date(record.date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>
                    {record.check_in_time 
                      ? format(new Date(record.check_in_time), 'hh:mm a') 
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {record.check_out_time 
                      ? format(new Date(record.check_out_time), 'hh:mm a') 
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{record.hours_worked || 0} hours</TableCell>
                  <TableCell>
                    <span className="capitalize">{record.status}</span>
                  </TableCell>
                  <TableCell>{record.notes || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-4 text-muted-foreground">
          No overtime records found for the selected period
        </div>
      )}
    </div>
  );
};

export default EmployeeOvertimeTable;

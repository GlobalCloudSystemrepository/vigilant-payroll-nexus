
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface EmployeeScheduleTableProps {
  employeeId: string;
  startDate: string;
  endDate: string;
}

const EmployeeScheduleTable = ({ employeeId, startDate, endDate }: EmployeeScheduleTableProps) => {
  const { data: schedules, isLoading } = useQuery({
    queryKey: ['employee-schedules', employeeId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          customer:customers!schedules_customer_id_fkey (
            company_name,
            customer_id
          )
        `)
        .eq('employee_id', employeeId)
        .gte('shift_date', startDate)
        .lte('shift_date', endDate)
        .order('shift_date', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!employeeId,
  });

  const getStatusBadge = (status: string) => {
    const statusColors = {
      scheduled: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
    };
    
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading schedules...</div>;
  }

  if (!schedules || schedules.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">No schedules found for the selected period</div>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>End Time</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schedules.map((schedule) => (
            <TableRow key={schedule.id}>
              <TableCell>{format(new Date(schedule.shift_date), 'MMM dd, yyyy')}</TableCell>
              <TableCell>
                {schedule.customer?.company_name || 'N/A'}
                <br />
                <small className="text-muted-foreground">
                  {schedule.customer?.customer_id || ''}
                </small>
              </TableCell>
              <TableCell>{schedule.location || 'N/A'}</TableCell>
              <TableCell>{schedule.start_time}</TableCell>
              <TableCell>{schedule.end_time}</TableCell>
              <TableCell>{getStatusBadge(schedule.status)}</TableCell>
              <TableCell>{schedule.notes || 'N/A'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default EmployeeScheduleTable;

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface EmployeeAttendanceTableProps {
  employeeId: string;
  startDate: string;
  endDate: string;
}

const EmployeeAttendanceTable = ({ employeeId, startDate, endDate }: EmployeeAttendanceTableProps) => {
  const { data: attendance, isLoading } = useQuery({
    queryKey: ['employee-attendance', employeeId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', employeeId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!employeeId,
  });

  const getStatusBadge = (status: string) => {
    const statusColors = {
      present: 'bg-green-100 text-green-800',
      absent: 'bg-red-100 text-red-800',
      late: 'bg-yellow-100 text-yellow-800',
      sick: 'bg-blue-100 text-blue-800',
    };
    
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return 'N/A';
    return format(new Date(timeString), 'hh:mm a');
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading attendance records...</div>;
  }

  if (!attendance || attendance.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">No attendance records found for the selected period</div>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Check In</TableHead>
            <TableHead>Check Out</TableHead>
            <TableHead>Hours Worked</TableHead>
            <TableHead>Overtime</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attendance.map((record) => (
            <TableRow key={record.id}>
              <TableCell>{format(new Date(record.date), 'MMM dd, yyyy')}</TableCell>
              <TableCell>{getStatusBadge(record.status)}</TableCell>
              <TableCell>{formatTime(record.check_in_time)}</TableCell>
              <TableCell>{formatTime(record.check_out_time)}</TableCell>
              <TableCell>{record.hours_worked || 'N/A'}</TableCell>
              <TableCell>
                {record.is_overtime ? (
                  <Badge className="bg-orange-100 text-orange-800">Yes</Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-800">No</Badge>
                )}
              </TableCell>
              <TableCell>{record.notes || 'N/A'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default EmployeeAttendanceTable;
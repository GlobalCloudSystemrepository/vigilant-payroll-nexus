
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface EmployeeCashAdvancesTableProps {
  employeeId: string;
  startDate: string;
  endDate: string;
}

const EmployeeCashAdvancesTable = ({ employeeId, startDate, endDate }: EmployeeCashAdvancesTableProps) => {
  const { data: cashAdvances, isLoading } = useQuery({
    queryKey: ['employee-cash-advances', employeeId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cash_advances')
        .select('*')
        .eq('employee_id', employeeId)
        .gte('date_requested', startDate)
        .lte('date_requested', endDate)
        .order('date_requested', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!employeeId,
  });

  const totalAdvances = cashAdvances?.reduce((sum, advance) => {
    return sum + (advance.amount || 0);
  }, 0) || 0;

  const approvedAdvances = cashAdvances?.filter(advance => advance.status === 'approved') || [];
  const totalApproved = approvedAdvances.reduce((sum, advance) => sum + (advance.amount || 0), 0);

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading cash advances...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-green-900">Total Approved Advances</h3>
          <p className="text-2xl font-bold text-green-700">${totalApproved.toFixed(2)}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900">Total Requested</h3>
          <p className="text-2xl font-bold text-blue-700">${totalAdvances.toFixed(2)}</p>
        </div>
      </div>

      {cashAdvances && cashAdvances.length > 0 ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date Requested</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Date Approved</TableHead>
                <TableHead>Approved By</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cashAdvances.map((advance) => (
                <TableRow key={advance.id}>
                  <TableCell>{format(new Date(advance.date_requested), 'MMM dd, yyyy')}</TableCell>
                  <TableCell className="font-semibold">${advance.amount.toFixed(2)}</TableCell>
                  <TableCell>{getStatusBadge(advance.status)}</TableCell>
                  <TableCell>{advance.reason || 'N/A'}</TableCell>
                  <TableCell>
                    {advance.date_approved 
                      ? format(new Date(advance.date_approved), 'MMM dd, yyyy') 
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{advance.approved_by || 'N/A'}</TableCell>
                  <TableCell>{advance.notes || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-4 text-muted-foreground">
          No cash advances found for the selected period
        </div>
      )}
    </div>
  );
};

export default EmployeeCashAdvancesTable;

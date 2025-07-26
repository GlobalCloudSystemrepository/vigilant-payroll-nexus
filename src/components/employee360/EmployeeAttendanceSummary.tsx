import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EmployeeAttendanceSummaryProps {
  employeeId: string;
  startDate: string;
  endDate: string;
}

const EmployeeAttendanceSummary = ({ employeeId, startDate, endDate }: EmployeeAttendanceSummaryProps) => {
  const { data: schedules } = useQuery({
    queryKey: ['employee-schedules-summary', employeeId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('employee_id', employeeId)
        .gte('shift_date', startDate)
        .lte('shift_date', endDate);
      
      if (error) throw error;
      return data;
    },
    enabled: !!employeeId,
  });

  const { data: attendance } = useQuery({
    queryKey: ['employee-attendance-summary', employeeId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', employeeId)
        .gte('date', startDate)
        .lte('date', endDate);
      
      if (error) throw error;
      return data;
    },
    enabled: !!employeeId,
  });

  const calculateScheduledHours = () => {
    if (!schedules) return 0;
    return schedules.reduce((total, schedule) => {
      const startTime = new Date(`2000-01-01T${schedule.start_time}`);
      const endTime = new Date(`2000-01-01T${schedule.end_time}`);
      const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      return total + hours;
    }, 0);
  };

  const getAttendanceStats = () => {
    if (!attendance) return { present: 0, absent: 0, late: 0, sick: 0, totalHours: 0 };
    
    const stats = attendance.reduce((acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1;
      acc.totalHours += Number(record.hours_worked) || 0;
      return acc;
    }, { present: 0, absent: 0, late: 0, sick: 0, totalHours: 0 });

    return stats;
  };

  const scheduledHours = calculateScheduledHours();
  const attendanceStats = getAttendanceStats();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{scheduledHours.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">Hours Scheduled</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{attendanceStats.totalHours.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">Hours Worked</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold">{schedules?.length || 0}</div>
            <div className="text-sm text-muted-foreground">Total Shifts</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold">{attendance?.length || 0}</div>
            <div className="text-sm text-muted-foreground">Attendance Records</div>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-semibold mb-3">Attendance Breakdown</h4>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-green-100 text-green-800">
              Present: {attendanceStats.present}
            </Badge>
            <Badge className="bg-red-100 text-red-800">
              Absent: {attendanceStats.absent}
            </Badge>
            <Badge className="bg-yellow-100 text-yellow-800">
              Late: {attendanceStats.late}
            </Badge>
            <Badge className="bg-blue-100 text-blue-800">
              Sick: {attendanceStats.sick}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeeAttendanceSummary;
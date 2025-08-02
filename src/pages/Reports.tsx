
import AttendanceReport from "@/components/reports/AttendanceReport";

export default function Reports() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Attendance Report</h1>
          <p className="text-muted-foreground">Scheduled vs Present analysis by customer</p>
        </div>
      </div>

      {/* Detailed Attendance Report */}
      <AttendanceReport />
    </div>
  );
}

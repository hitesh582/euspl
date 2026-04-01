import { useQuery } from "@tanstack/react-query";

interface AttendanceRecord {
  employee_id: string;
  employee_name: string;
  date: string;
  first_in?: string;
  last_out?: string;
  total_minutes: number;
  overtime_minutes: number;
  status: "present" | "absent" | "partial";
  sessions: { in: string; out?: string; minutes?: number }[];
}

interface AttendanceResponse {
  attendance: AttendanceRecord[];
  date: string;
}

async function fetchAttendance(date: string): Promise<AttendanceResponse> {
  const res = await fetch(`/api/attendance?date=${date}`);
  if (!res.ok) throw new Error("Failed to fetch attendance");
  return res.json();
}

export function useAttendance(date: string) {
  return useQuery<AttendanceResponse>({
    queryKey: ["attendance", date],
    queryFn: () => fetchAttendance(date),
  });
}

interface ReportRow {
  employee_id: string;
  employee_name: string;
  department?: string;
  present_days: number;
  partial_days: number;
  absent_days: number;
  total_minutes: number;
  overtime_minutes: number;
}

interface ReportResponse {
  report: ReportRow[];
  start_date: string;
  end_date: string;
}

async function fetchReport(startDate: string, endDate: string): Promise<ReportResponse> {
  const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
  const res = await fetch(`/api/attendance/report?${params}`);
  if (!res.ok) throw new Error("Failed to fetch report");
  return res.json();
}

export function useAttendanceReport(startDate: string, endDate: string) {
  return useQuery<ReportResponse>({
    queryKey: ["attendance-report", startDate, endDate],
    queryFn: () => fetchReport(startDate, endDate),
  });
}

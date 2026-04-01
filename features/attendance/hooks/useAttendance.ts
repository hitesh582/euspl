import { useQuery } from "@tanstack/react-query";
import type { AttendanceResponse, ReportResponse } from "../types";

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

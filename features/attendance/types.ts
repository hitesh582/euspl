export interface AttendanceRecord {
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

export interface AttendanceResponse {
  attendance: AttendanceRecord[];
  date: string;
}

export interface ReportRow {
  employee_id: string;
  employee_name: string;
  department?: string;
  present_days: number;
  partial_days: number;
  absent_days: number;
  total_minutes: number;
  overtime_minutes: number;
}

export interface ReportResponse {
  report: ReportRow[];
  start_date: string;
  end_date: string;
}

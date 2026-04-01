export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "guard";
  created_at: string;
}

export interface Employee {
  id: string;
  employee_id: string;
  name: string;
  department?: string;
  position?: string;
  email?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Log {
  id: string;
  employee_id: string;
  type: "IN" | "OUT";
  timestamp: string;
  date: string;
  employee_name?: string;
}

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

export interface DashboardStats {
  total_employees: number;
  present_today: number;
  absent_today: number;
  total_logs_today: number;
  recent_scans: (Log & { employee_name: string })[];
}

import { getLogsByDate } from "./log.model";
import { getEmployees } from "./employee.model";

interface Session {
  in: string;
  out?: string;
  minutes?: number;
}

export interface ComputedAttendance {
  employee_id: string;
  employee_name: string;
  date: string;
  first_in?: string;
  last_out?: string;
  total_minutes: number;
  overtime_minutes: number;
  status: "present" | "absent" | "partial";
  sessions: Session[];
}

const STANDARD_MINUTES = 480; // 8 hours

export async function computeAttendance(date: string, employeeId?: string): Promise<ComputedAttendance[]> {
  const logs = await getLogsByDate(date, employeeId);
  const employees = await getEmployees();

  const targetEmployees = employeeId
    ? employees.filter((e) => e.employee_id === employeeId)
    : employees;

  return targetEmployees.map((emp) => {
    const empLogs = logs.filter((l) => l.employee_id === emp.employee_id);

    if (empLogs.length === 0) {
      return {
        employee_id: emp.employee_id,
        employee_name: emp.name,
        date,
        total_minutes: 0,
        overtime_minutes: 0,
        status: "absent" as const,
        sessions: [],
      };
    }

    const sessions: Session[] = [];
    let currentIn: string | null = null;

    for (const log of empLogs) {
      if (log.type === "IN") {
        currentIn = log.timestamp;
      } else if (log.type === "OUT" && currentIn) {
        const mins = Math.round((new Date(log.timestamp).getTime() - new Date(currentIn).getTime()) / 60000);
        sessions.push({ in: currentIn, out: log.timestamp, minutes: mins });
        currentIn = null;
      }
    }

    if (currentIn) {
      sessions.push({ in: currentIn });
    }

    const totalMinutes = sessions.reduce((sum, s) => sum + (s.minutes || 0), 0);
    const firstIn = empLogs.find((l) => l.type === "IN")?.timestamp;
    const outLogs = empLogs.filter((l) => l.type === "OUT");
    const lastOut = outLogs.length > 0 ? outLogs[outLogs.length - 1].timestamp : undefined;

    return {
      employee_id: emp.employee_id,
      employee_name: emp.name,
      date,
      first_in: firstIn,
      last_out: lastOut,
      total_minutes: totalMinutes,
      overtime_minutes: Math.max(0, totalMinutes - STANDARD_MINUTES),
      status: totalMinutes >= STANDARD_MINUTES ? "present" as const : totalMinutes > 0 ? "partial" as const : "absent" as const,
      sessions,
    };
  });
}

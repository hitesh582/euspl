import type { Log, AttendanceRecord } from "@/types";

const WORK_HOURS = 8;
const WORK_MINUTES = WORK_HOURS * 60;
const AUTO_CLOSE_HOUR = 22;

export function computeAttendance(
  employeeId: string,
  employeeName: string,
  date: string,
  logs: Log[]
): AttendanceRecord {
  const dayLogs = logs
    .filter((l) => l.employee_id === employeeId && l.date === date)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  if (dayLogs.length === 0) {
    return {
      employee_id: employeeId,
      employee_name: employeeName,
      date,
      total_minutes: 0,
      overtime_minutes: 0,
      status: "absent",
      sessions: [],
    };
  }

  const sessions: { in: string; out?: string; minutes?: number }[] = [];
  let i = 0;

  while (i < dayLogs.length) {
    if (dayLogs[i].type === "IN") {
      const inTime = dayLogs[i].timestamp;
      let outTime: string | undefined;

      if (i + 1 < dayLogs.length && dayLogs[i + 1].type === "OUT") {
        outTime = dayLogs[i + 1].timestamp;
        i += 2;
      } else {
        const autoCloseDate = new Date(date);
        autoCloseDate.setHours(AUTO_CLOSE_HOUR, 0, 0, 0);
        const now = new Date();
        if (now < autoCloseDate) {
          outTime = undefined;
        } else {
          outTime = autoCloseDate.toISOString();
        }
        i += 1;
      }

      const minutes = outTime
        ? Math.floor((new Date(outTime).getTime() - new Date(inTime).getTime()) / 60000)
        : undefined;

      sessions.push({ in: inTime, out: outTime, minutes });
    } else {
      i += 1;
    }
  }

  const totalMinutes = sessions.reduce((sum, s) => sum + (s.minutes || 0), 0);
  const overtimeMinutes = Math.max(0, totalMinutes - WORK_MINUTES);

  const firstIn = dayLogs.find((l) => l.type === "IN")?.timestamp;
  const lastOut = [...dayLogs].reverse().find((l) => l.type === "OUT")?.timestamp;

  return {
    employee_id: employeeId,
    employee_name: employeeName,
    date,
    first_in: firstIn,
    last_out: lastOut,
    total_minutes: totalMinutes,
    overtime_minutes: overtimeMinutes,
    status: sessions.length === 0 ? "absent" : totalMinutes >= WORK_MINUTES ? "present" : "partial",
    sessions,
  };
}

export function computeAttendanceForRange(
  employeeId: string,
  employeeName: string,
  dates: string[],
  logs: Log[]
): AttendanceRecord[] {
  return dates.map((date) => computeAttendance(employeeId, employeeName, date, logs));
}

export interface ScanResult {
  employeeName: string;
  employeeId: string;
  type: "IN" | "OUT";
  timestamp: string;
}

export type ScanState = "idle" | "scanning" | "success" | "error";

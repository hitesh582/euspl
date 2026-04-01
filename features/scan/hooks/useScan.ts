import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ScanResult } from "../types";

async function processScan(employeeId: string): Promise<ScanResult> {
  const res = await fetch("/api/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ employeeId: employeeId.trim() }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Scan failed");
  return {
    employeeName: data.employeeName,
    employeeId: data.employeeId,
    type: data.type,
    timestamp: data.timestamp,
  };
}

export function useScan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: processScan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

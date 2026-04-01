import { useQuery } from "@tanstack/react-query";

interface DashboardData {
  total_employees: number;
  present_today: number;
  absent_today: number;
  total_logs_today: number;
  recent_scans: any[];
}

async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch("/api/dashboard");
  if (!res.ok) throw new Error("Failed to fetch dashboard");
  return res.json();
}

export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    refetchInterval: 30000,
  });
}

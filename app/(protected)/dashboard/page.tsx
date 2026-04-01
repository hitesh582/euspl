"use client";

import { useEffect, useState } from "react";
import { formatTime } from "@/lib/utils";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardAction, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

interface DashboardData {
  total_employees: number;
  present_today: number;
  absent_today: number;
  total_logs_today: number;
  recent_scans: any[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));

    const interval = setInterval(() => {
      fetch("/api/dashboard")
        .then((r) => r.json())
        .then(setData)
        .catch(console.error);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const attendanceRate = data && data.total_employees > 0
    ? Math.round((data.present_today / data.total_employees) * 100)
    : 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">{today}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Employees" value={data?.total_employees ?? 0} icon="👥" shade="dark" href="/employees" />
        <StatCard title="Present Today" value={data?.present_today ?? 0} icon="✓" shade="medium" sub={`${attendanceRate}% attendance rate`} />
        <StatCard title="Absent Today" value={data?.absent_today ?? 0} icon="✗" shade="light" />
        <StatCard title="Scans Today" value={data?.total_logs_today ?? 0} icon="◎" shade="default" href="/scan" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Scans</CardTitle>
            <CardAction>
              <Link href="/attendance" className="text-sm text-muted-foreground hover:text-foreground hover:underline">
                View all
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            {!data?.recent_scans?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-3xl mb-2">—</p>
                <p>No scans today yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {data.recent_scans.map((scan) => (
                  <div key={scan.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className={scan.type === "IN" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}>
                          {scan.type === "IN" ? "→" : "←"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{scan.employee_name}</p>
                        <p className="text-xs text-muted-foreground">{scan.employee_id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={scan.type === "IN" ? "default" : "secondary"}>
                        {scan.type}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatTime(scan.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/scan" className="flex flex-col items-center gap-2 p-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-colors text-center">
                <span className="text-2xl">◎</span>
                <span className="text-sm font-medium">Scan QR Code</span>
              </Link>
              <Link href="/employees/create" className="flex flex-col items-center gap-2 p-4 bg-secondary hover:bg-secondary/80 rounded-xl transition-colors text-center">
                <span className="text-2xl">+</span>
                <span className="text-sm font-medium text-secondary-foreground">Add Employee</span>
              </Link>
              <Link href="/attendance" className="flex flex-col items-center gap-2 p-4 bg-secondary hover:bg-secondary/80 rounded-xl transition-colors text-center">
                <span className="text-2xl">☰</span>
                <span className="text-sm font-medium text-secondary-foreground">View Attendance</span>
              </Link>
              <Link href="/attendance/reports" className="flex flex-col items-center gap-2 p-4 bg-secondary hover:bg-secondary/80 rounded-xl transition-colors text-center">
                <span className="text-2xl">⊞</span>
                <span className="text-sm font-medium text-secondary-foreground">Reports</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  shade,
  sub,
  href,
}: {
  title: string;
  value: number;
  icon: string;
  shade: "dark" | "medium" | "light" | "default";
  sub?: string;
  href?: string;
}) {
  const shades = {
    dark: "bg-neutral-900 text-white",
    medium: "bg-neutral-700 text-white",
    light: "bg-neutral-300 text-neutral-800",
    default: "bg-muted text-muted-foreground",
  };

  const content = (
    <Card className={href ? "hover:shadow-md transition-shadow cursor-pointer" : ""}>
      <CardContent>
        <div className="flex items-center justify-between mb-3">
          <span className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${shades[shade]}`}>
            {icon}
          </span>
        </div>
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-sm font-medium text-muted-foreground mt-1">{title}</p>
        {sub && <p className="text-xs text-muted-foreground/70 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

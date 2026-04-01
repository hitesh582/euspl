"use client";

import { useEffect, useState } from "react";
import { formatHours, minutesToHoursDecimal, getTodayDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

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

function getFirstOfMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export default function ReportsPage() {
  const [report, setReport] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(getFirstOfMonth());
  const [endDate, setEndDate] = useState(getTodayDate());
  const [employeeFilter, setEmployeeFilter] = useState("");

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
    const res = await fetch(`/api/attendance/report?${params}`);
    const data = await res.json();
    setReport(data.report || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [startDate, endDate]);

  function exportCSV() {
    const headers = ["Employee ID", "Name", "Department", "Present Days", "Partial Days", "Absent Days", "Total Hours", "Overtime Hours"];
    const rows = filtered.map((r) => [
      r.employee_id,
      r.employee_name,
      r.department || "",
      r.present_days,
      r.partial_days,
      r.absent_days,
      minutesToHoursDecimal(r.total_minutes),
      minutesToHoursDecimal(r.overtime_minutes),
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-report-${startDate}-to-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = report.filter(
    (r) =>
      r.employee_name.toLowerCase().includes(employeeFilter.toLowerCase()) ||
      r.employee_id.toLowerCase().includes(employeeFilter.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground mt-1">Monthly and custom date range attendance reports</p>
        </div>
        <Button onClick={exportCSV} className="gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Label>From:</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            max={endDate}
            className="w-auto h-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label>To:</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            max={getTodayDate()}
            className="w-auto h-9"
          />
        </div>
        <Input
          type="text"
          placeholder="Filter by employee..."
          value={employeeFilter}
          onChange={(e) => setEmployeeFilter(e.target.value)}
          className="w-auto h-9"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Generating report...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-muted-foreground">No data available for the selected period</p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-6">Employee</TableHead>
                <TableHead className="px-6 hidden md:table-cell">Department</TableHead>
                <TableHead className="px-4 text-center">Present</TableHead>
                <TableHead className="px-4 text-center hidden sm:table-cell">Partial</TableHead>
                <TableHead className="px-4 text-center">Absent</TableHead>
                <TableHead className="px-6 text-right">Total Hours</TableHead>
                <TableHead className="px-6 text-right hidden lg:table-cell">Overtime</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => (
                <TableRow key={row.employee_id}>
                  <TableCell className="px-6 py-4">
                    <p className="text-sm font-medium">{row.employee_name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{row.employee_id}</p>
                  </TableCell>
                  <TableCell className="px-6 py-4 hidden md:table-cell text-sm text-muted-foreground">
                    {row.department || "—"}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-center">
                    <Badge>{row.present_days}</Badge>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-center hidden sm:table-cell">
                    <Badge variant="outline">{row.partial_days}</Badge>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-center">
                    <Badge variant="secondary">{row.absent_days}</Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right text-sm font-medium">
                    {formatHours(row.total_minutes)}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right hidden lg:table-cell">
                    {row.overtime_minutes > 0 ? (
                      <span className="text-sm font-medium">+{formatHours(row.overtime_minutes)}</span>
                    ) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

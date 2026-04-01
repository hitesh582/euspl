"use client";

import { useState } from "react";
import { formatTime, formatHours, getTodayDate } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useAttendance } from "@/features/attendance/hooks/useAttendance";

export default function AttendancePage() {
  const [date, setDate] = useState(getTodayDate());
  const { data, isLoading: loading } = useAttendance(date);
  const attendance = data?.attendance || [];

  const present = attendance.filter((a) => a.status !== "absent").length;
  const absent = attendance.filter((a) => a.status === "absent").length;

  const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
    present: "default",
    partial: "outline",
    absent: "secondary",
  };

  const statusLabels = {
    present: "Present",
    partial: "Partial",
    absent: "Absent",
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Attendance</h1>
          <p className="text-muted-foreground mt-1">Daily attendance overview</p>
        </div>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={getTodayDate()}
          className="w-auto h-10"
        />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="text-center py-4">
            <p className="text-3xl font-bold">{present}</p>
            <p className="text-sm font-medium mt-1 opacity-80">Present</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary">
          <CardContent className="text-center py-4">
            <p className="text-3xl font-bold text-secondary-foreground">{absent}</p>
            <p className="text-sm text-muted-foreground font-medium mt-1">Absent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-4">
            <p className="text-3xl font-bold">{attendance.length}</p>
            <p className="text-sm text-muted-foreground font-medium mt-1">Total</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading attendance...</div>
      ) : attendance.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-muted-foreground">No employees found</p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-6">Employee</TableHead>
                <TableHead className="px-6">Status</TableHead>
                <TableHead className="px-6 hidden sm:table-cell">First IN</TableHead>
                <TableHead className="px-6 hidden sm:table-cell">Last OUT</TableHead>
                <TableHead className="px-6">Hours</TableHead>
                <TableHead className="px-6 hidden md:table-cell">Overtime</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendance.map((a) => (
                <TableRow key={a.employee_id}>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                          {a.employee_name[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{a.employee_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{a.employee_id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Badge variant={statusVariant[a.status]}>
                      {statusLabels[a.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 hidden sm:table-cell text-sm text-muted-foreground">
                    {a.first_in ? formatTime(a.first_in) : "—"}
                  </TableCell>
                  <TableCell className="px-6 py-4 hidden sm:table-cell text-sm text-muted-foreground">
                    {a.last_out ? formatTime(a.last_out) : a.status !== "absent" ? (
                      <Badge variant="outline" className="text-xs">Still in</Badge>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm font-medium">
                    {a.total_minutes > 0 ? formatHours(a.total_minutes) : "—"}
                  </TableCell>
                  <TableCell className="px-6 py-4 hidden md:table-cell">
                    {a.overtime_minutes > 0 ? (
                      <span className="text-sm font-medium">+{formatHours(a.overtime_minutes)}</span>
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

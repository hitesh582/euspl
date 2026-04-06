"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useEmployees, useDeleteEmployee } from "@/features/employee/hooks/useEmployees";
import { useDebounce } from "@/hooks/useDebounce";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

export default function EmployeesPage() {
  const { data: employees = [], isLoading: loading } = useEmployees();
  const deleteEmployee = useDeleteEmployee();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [employeeToDelete, setEmployeeToDelete] = useState<{ id: string; name: string } | null>(null);

  function confirmDelete() {
    if (!employeeToDelete) return;
    deleteEmployee.mutate(employeeToDelete.id, {
      onSettled: () => setEmployeeToDelete(null),
    });
  }

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      e.employee_id.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (e.department || "").toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-muted-foreground mt-1">{employees.length} total employees</p>
        </div>
        <Link href="/employees/create">
          <Button className="gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Employee
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search by name, ID, or department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md h-10"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading employees...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-muted-foreground font-medium">
            {search ? "No employees match your search" : "No employees yet"}
          </p>
          {!search && (
            <Link href="/employees/create" className="mt-3 inline-block text-foreground hover:underline text-sm">
              Add your first employee
            </Link>
          )}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-6">Employee</TableHead>
                <TableHead className="px-6">ID</TableHead>
                <TableHead className="px-6 hidden md:table-cell">Department</TableHead>
                <TableHead className="px-6 hidden lg:table-cell">Added</TableHead>
                <TableHead className="px-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                          {emp.name[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{emp.name}</p>
                        {emp.position && <p className="text-xs text-muted-foreground">{emp.position}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Badge variant="secondary" className="font-mono">
                      {emp.employee_id}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 hidden md:table-cell text-muted-foreground">
                    {emp.department || "—"}
                  </TableCell>
                  <TableCell className="px-6 py-4 hidden lg:table-cell text-muted-foreground">
                    {formatDate(emp.created_at)}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/employees/${emp.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEmployeeToDelete({ id: emp.id, name: emp.name })}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <ConfirmDialog
        open={!!employeeToDelete}
        onOpenChange={(open) => !open && setEmployeeToDelete(null)}
        title={`Delete ${employeeToDelete?.name}?`}
        description="This will also delete all their attendance logs. This action cannot be undone."
        onConfirm={confirmDelete}
        confirmText="Delete"
        variant="destructive"
        isPending={deleteEmployee.isPending}
      />
    </div>
  );
}

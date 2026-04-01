"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface UserRecord {
  _id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export default function UsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    fetchUsers();
  }, [user, router]);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) {
        if (res.status === 403) {
          router.push("/dashboard");
          return;
        }
        throw new Error("Failed to fetch users");
      }
      const data = await res.json();
      setUsers(data.users);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    setUpdating(userId);
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to update role");
        return;
      }
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      console.error("Failed to update role:", err);
      alert("Failed to update role");
    } finally {
      setUpdating(null);
    }
  }

  function getRoleBadgeVariant(role: string) {
    switch (role) {
      case "admin":
        return "default" as const;
      case "guard":
        return "secondary" as const;
      default:
        return "outline" as const;
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="mx-auto w-8 h-8 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage user accounts and assign roles
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-sm text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {users.filter((u) => u.role === "admin").length}
            </div>
            <p className="text-sm text-muted-foreground">Admins</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {users.filter((u) => u.role === "guard").length}
            </div>
            <p className="text-sm text-muted-foreground">Guards</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              No users found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Change Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const isCurrentUser = user?.userId === u._id;
                  return (
                    <TableRow key={u._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">
                              {u.name?.[0]?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {u.name}
                            {isCurrentUser && (
                              <span className="text-muted-foreground text-xs ml-1">
                                (you)
                              </span>
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {u.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(u.role)}>
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {u.created_at
                          ? new Date(u.created_at).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {isCurrentUser ? (
                          <span className="text-xs text-muted-foreground">
                            Cannot change own role
                          </span>
                        ) : (
                          <Select
                            value={u.role}
                            onValueChange={(val: string | null) => {
                              if (val) handleRoleChange(u._id, val);
                            }}
                            disabled={updating === u._id}
                          >
                            <SelectTrigger className="w-28 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="guard">Guard</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

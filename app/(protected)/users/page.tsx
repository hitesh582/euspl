"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { useUsers, useUpdateUserRole, useDeleteUser } from "@/features/users/hooks/useUsers";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

export default function UsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { data: users = [], isLoading: loading, error } = useUsers();
  const updateRole = useUpdateUserRole();
  const deleteUser = useDeleteUser();
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);

  function confirmDelete() {
    if (!userToDelete) return;
    deleteUser.mutate(userToDelete.id, {
      onSettled: () => setUserToDelete(null),
      onError: (err) => alert(err.message),
    });
  }

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard");
    }
    if (error?.message === "FORBIDDEN") {
      router.push("/dashboard");
    }
  }, [user, router, error]);

  function handleRoleChange(userId: string, newRole: string) {
    updateRole.mutate({ userId, role: newRole }, {
      onError: (err) => alert(err.message),
    });
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
    <div className="p-8">
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
                  <TableHead className="text-right">Actions</TableHead>
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
                            disabled={updateRole.isPending}
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
                      <TableCell className="text-right">
                        {!isCurrentUser && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setUserToDelete({ id: u._id, name: u.name })}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            Delete
                          </Button>
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

      <ConfirmDialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
        title={`Delete User ${userToDelete?.name}?`}
        description="This will permanently delete their login account and revoke dashboard access. This action cannot be undone."
        onConfirm={confirmDelete}
        confirmText="Delete"
        variant="destructive"
        isPending={deleteUser.isPending}
      />
    </div>
  );
}

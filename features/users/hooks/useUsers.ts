import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface UserRecord {
  _id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

async function fetchUsers(): Promise<UserRecord[]> {
  const res = await fetch("/api/users");
  if (!res.ok) {
    if (res.status === 403) throw new Error("FORBIDDEN");
    throw new Error("Failed to fetch users");
  }
  const data = await res.json();
  return data.users;
}

async function updateRole({ userId, role }: { userId: string; role: string }) {
  const res = await fetch(`/api/users/${userId}/role`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update role");
  return data.user;
}

export function useUsers() {
  return useQuery<UserRecord[]>({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

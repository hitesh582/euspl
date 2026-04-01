import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Employee {
  id: string;
  _id?: string;
  employee_id: string;
  name: string;
  department?: string;
  position?: string;
  email?: string;
  phone?: string;
  created_at: string;
}

async function fetchEmployees(): Promise<Employee[]> {
  const res = await fetch("/api/employees");
  if (!res.ok) throw new Error("Failed to fetch employees");
  const data = await res.json();
  return data.employees || [];
}

async function deleteEmployee(id: string): Promise<void> {
  const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to delete employee");
  }
}

export function useEmployees() {
  return useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: fetchEmployees,
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

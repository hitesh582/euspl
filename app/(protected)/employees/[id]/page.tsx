"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { Card, CardHeader, CardTitle, CardAction, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Employee {
  id: string;
  employee_id: string;
  name: string;
  department?: string;
  position?: string;
  email?: string;
  phone?: string;
  created_at: string;
}

interface Log {
  id: string;
  employee_id: string;
  type: "IN" | "OUT";
  timestamp: string;
  date: string;
}

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [qrCode, setQrCode] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", department: "", position: "", email: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch(`/api/employees/${params.id}`);
    if (!res.ok) { router.push("/employees"); return; }
    const data = await res.json();
    setEmployee(data.employee);
    setLogs(data.logs || []);
    setForm({
      name: data.employee.name,
      department: data.employee.department || "",
      position: data.employee.position || "",
      email: data.employee.email || "",
      phone: data.employee.phone || "",
    });

    const qrRes = await fetch(`/api/employees/${params.id}/qr`);
    if (qrRes.ok) {
      const qrData = await qrRes.json();
      setQrCode(qrData.qrCode);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [params.id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch(`/api/employees/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }
    setEmployee(data.employee);
    setEditing(false);
    setSaving(false);
  }

  function downloadQR() {
    if (!employee || !qrCode) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height + 80;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
      
      ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
      ctx.fillText(employee.name, canvas.width / 2, img.height + 25);
      
      ctx.font = "24px monospace";
      ctx.fillText(employee.employee_id, canvas.width / 2, img.height + 55);

      const link = document.createElement("a");
      link.download = `QR-${employee.employee_id}-${employee.name}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = qrCode;
  }

  if (loading) return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (!employee) return null;

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/employees" className="text-muted-foreground hover:text-foreground">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold">{employee.name}</h1>
        <Badge variant="secondary" className="font-mono">
          {employee.employee_id}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Employee Information</CardTitle>
              <CardAction>
                <Button variant="ghost" size="sm" onClick={() => setEditing(!editing)}>
                  {editing ? "Cancel" : "Edit"}
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              {editing ? (
                <form onSubmit={handleSave} className="space-y-4">
                  {error && <div className="text-foreground text-sm bg-secondary p-3 rounded-lg">{error}</div>}
                  {[
                    { label: "Full Name", name: "name", required: true },
                    { label: "Department", name: "department" },
                    { label: "Position", name: "position" },
                    { label: "Email", name: "email", type: "email" },
                    { label: "Phone", name: "phone" },
                  ].map((field) => (
                    <FormField
                      key={field.name}
                      label={`${field.label}${field.required ? " *" : ""}`}
                      id={`edit-${field.name}`}
                      type={field.type || "text"}
                      name={field.name}
                      value={(form as any)[field.name]}
                      onChange={(e) => setForm((f) => ({ ...f, [field.name]: e.target.value }))}
                      required={field.required}
                      className="h-10"
                    />
                  ))}
                  <Button type="submit" disabled={saving} size="sm">
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Name", value: employee.name },
                    { label: "Employee ID", value: employee.employee_id, mono: true },
                    { label: "Department", value: employee.department },
                    { label: "Position", value: employee.position },
                    { label: "Email", value: employee.email },
                    { label: "Phone", value: employee.phone },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
                      <p className={`text-sm mt-0.5 ${item.mono ? "font-mono" : ""}`}>
                        {item.value || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-muted-foreground text-sm">No scans recorded yet</p>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <Avatar size="sm">
                          <AvatarFallback className={log.type === "IN" ? "bg-primary text-primary-foreground text-xs" : "bg-secondary text-secondary-foreground text-xs"}>
                            {log.type === "IN" ? "→" : "←"}
                          </AvatarFallback>
                        </Avatar>
                        <Badge variant={log.type === "IN" ? "default" : "secondary"}>
                          {log.type}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">{formatDateTime(log.timestamp)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>QR Code</CardTitle>
            </CardHeader>
            <CardContent>
              {qrCode ? (
                <div className="text-center">
                  <div className="bg-background p-4 rounded-xl border-2 border-border inline-block mb-4">
                    <img src={qrCode} alt="Employee QR Code" className="w-40 h-40" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Encode: <span className="font-mono font-medium">{employee.employee_id}</span>
                  </p>
                  <Button onClick={downloadQR} className="w-full py-5" size="default">
                    Download QR Code
                  </Button>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-4">Loading QR code...</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

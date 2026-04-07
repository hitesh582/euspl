"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { Card, CardContent } from "@/components/ui/card";

export default function CreateEmployeePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    department: "",
    position: "",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create employee");
      router.push(`/employees/${data.employee.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/employees" className="text-muted-foreground hover:text-foreground">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Add Employee</h1>
          <p className="text-muted-foreground text-sm mt-0.5">A unique QR code will be generated automatically</p>
        </div>
      </div>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-secondary border border-border text-foreground px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <FormField label="Full Name *" id="name" name="name" value={form.name} onChange={handleChange} required placeholder="Full Name" className="h-10" />

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Department" id="department" name="department" value={form.department} onChange={handleChange} placeholder="Department" className="h-10" />
              <FormField label="Position" id="position" name="position" value={form.position} onChange={handleChange} placeholder="Position" className="h-10" />
            </div>

            <FormField label="Email" id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email Id" className="h-10" />

            <FormField label="Phone" id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="Phone Number" className="h-10" />

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Employee"}
              </Button>
              <Link href="/employees">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

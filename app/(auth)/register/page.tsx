"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="text-3xl font-bold text-neutral-900 mb-10">Sign up</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-5">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Full Name"
          id="name"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          placeholder="Full Name"
          className="h-11 rounded-full bg-neutral-100 border-0 px-4"
        />

        <FormField
          label="Email Address"
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
          placeholder="Email ID"
          className="h-11 rounded-full bg-neutral-100 border-0 px-4"
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <FormField
              label="Password"
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
              placeholder="••••••••"
              className="h-11 rounded-full bg-neutral-100 border-0 px-4 pr-9"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[33px] text-neutral-400 hover:text-neutral-600 cursor-pointer"
            >
              {showPassword ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
            </Button>
          </div>
          <div className="relative">
            <FormField
              label="Confirm Password"
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              value={form.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
              placeholder="••••••••"
              className="h-11 rounded-full bg-neutral-100 border-0 px-4 pr-9"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-[33px] text-neutral-400 hover:text-neutral-600 cursor-pointer"
            >
              {showConfirm ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
            </Button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-full bg-neutral-900 text-white hover:bg-neutral-800 mt-2 cursor-pointer"
        >
          {loading ? "Creating account..." : "Create Account"}
        </Button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-neutral-200" />
        <span className="text-xs text-neutral-400">Or</span>
        <div className="flex-1 h-px bg-neutral-200" />
      </div>

      <Link
        href="/login"
        className="block w-full h-11 rounded-full bg-neutral-100 text-neutral-700 text-sm font-medium text-center leading-11 hover:bg-neutral-200 transition cursor-pointer"
      >
        Log in
      </Link>
    </>
  );
}

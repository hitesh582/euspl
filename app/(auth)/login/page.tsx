"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="text-3xl font-bold text-neutral-900 mb-10">Log in</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <FormField
          label="Email address"
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="Email ID"
          className="h-11 rounded-full bg-neutral-100 border-0 px-4"
        />

        <div className="relative">
          <FormField
            label="Password"
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Password"
            className="h-11 rounded-full bg-neutral-100 border-0 px-4 pr-11"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[33px] text-neutral-400 hover:text-neutral-600 cursor-pointer"
          >
            {showPassword ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
          </Button>
        </div>

        <div className="flex items-center justify-end text-xs text-neutral-500">
          <Link href="/forgot-password" className="text-xs text-neutral-500 hover:text-neutral-700 hover:underline">
            Forgot Password?
          </Link>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-full bg-neutral-900 text-white hover:bg-neutral-800 cursor-pointer"
        >
          {loading ? "Logging in..." : "Log in"}
        </Button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-neutral-200" />
        <span className="text-xs text-neutral-400">Or</span>
        <div className="flex-1 h-px bg-neutral-200" />
      </div>

      <Link
        href="/register"
        className="block w-full h-11 rounded-full bg-neutral-100 text-neutral-700 text-sm font-medium text-center leading-11 hover:bg-neutral-200 transition cursor-pointer"
      >
        Sign up
      </Link>
    </>
  );
}

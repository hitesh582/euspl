"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const { mutate, isPending, error, reset } = useMutation({
    mutationFn: async (email: string) => {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send reset email");
      return data;
    },
    onSuccess: (data) => {
      setMessage(data.message);
      setEmail("");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    reset();
    mutate(email);
  }

  return (
    <>
      <h1 className="text-3xl font-bold text-neutral-900 mb-10">Forgot Password</h1>

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm mb-6">
          {message}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
          {error.message}
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
          disabled={isPending}
          placeholder="Enter your email"
          className="h-11 rounded-full bg-neutral-100 border-0 px-4"
        />

        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-11 rounded-full bg-neutral-900 text-white hover:bg-neutral-800 cursor-pointer"
        >
          {isPending ? "Sending..." : "Send Reset Link"}
        </Button>
      </form>

      <div className="text-center mt-5">
        <Link
          href="/login"
          className="text-sm text-neutral-500 hover:text-neutral-700 hover:underline"
        >
          Back to Login
        </Link>
      </div>
    </>
  );
}

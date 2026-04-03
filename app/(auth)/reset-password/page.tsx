"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  // Validate token on page load
  const {
    data: tokenData,
    isLoading: validating,
    error: tokenError,
  } = useQuery({
    queryKey: ["reset-token", token],
    queryFn: async () => {
      if (!token) throw new Error("No reset token provided");
      const res = await fetch(`/api/auth/reset-password?token=${token}`);
      const data = await res.json();
      if (!data.valid) throw new Error(data.error || "Invalid or expired reset token");
      return data;
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Reset password mutation
  const {
    mutate,
    isPending,
    error: resetError,
    reset,
  } = useMutation({
    mutationFn: async (payload: { token: string; password: string; confirmPassword: string }) => {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");
      return data;
    },
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    },
  });

  function onSubmit(data: ResetPasswordInput) {
    reset();
    if (!token) return;
    mutate({ token, password: data.password, confirmPassword: data.confirmPassword });
  }

  if (validating) {
    return (
      <>
        <h1 className="text-3xl font-bold text-neutral-900 mb-10">Reset Password</h1>
        <p className="text-neutral-500 text-sm">Validating reset token...</p>
      </>
    );
  }

  if (tokenError) {
    return (
      <>
        <h1 className="text-3xl font-bold text-neutral-900 mb-10">Invalid Reset Link</h1>

        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
          {tokenError.message}
        </div>

        <div className="space-y-3">
          <Link href="/forgot-password">
            <Button variant="outline" className="w-full h-11 rounded-full cursor-pointer">
              Request New Reset Link
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost" className="w-full h-11 rounded-full cursor-pointer">
              Back to Login
            </Button>
          </Link>
        </div>
      </>
    );
  }

  if (success) {
    return (
      <>
        <h1 className="text-3xl font-bold text-neutral-900 mb-10">Password Reset Successful</h1>

        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
          Your password has been reset successfully. Redirecting to login...
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="text-3xl font-bold text-neutral-900 mb-2">Reset Password</h1>
      {tokenData?.email && (
        <p className="text-sm text-neutral-500 mb-10">for {tokenData.email}</p>
      )}

      {resetError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
          {resetError.message}
        </div>
      )}

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="relative">
          <FormField
            label="New Password"
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter new password"
            disabled={isPending}
            error={errors.password?.message}
            className="h-11 rounded-full bg-neutral-100 border-0 px-4 pr-11"
            {...register("password")}
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

        <div className="relative">
          <FormField
            label="Confirm Password"
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm new password"
            disabled={isPending}
            error={errors.confirmPassword?.message}
            className="h-11 rounded-full bg-neutral-100 border-0 px-4 pr-11"
            {...register("confirmPassword")}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-[33px] text-neutral-400 hover:text-neutral-600 cursor-pointer"
          >
            {showConfirmPassword ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
          </Button>
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-11 rounded-full bg-neutral-900 text-white hover:bg-neutral-800 cursor-pointer"
        >
          {isPending ? "Resetting..." : "Reset Password"}
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

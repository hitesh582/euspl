"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: LoginInput) {
    setError("");
    try {
      await login(data.email, data.password);
    } catch (err: any) {
      setError(err.message);
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

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          label="Email address"
          id="email"
          type="email"
          placeholder="Email ID"
          error={errors.email?.message}
          className="h-11 rounded-full bg-neutral-100 border-0 px-4"
          {...register("email")}
        />

        <div className="relative">
          <FormField
            label="Password"
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
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

        <div className="flex items-center justify-end text-xs text-neutral-500">
          <Link href="/forgot-password" className="text-xs text-neutral-500 hover:text-neutral-700 hover:underline">
            Forgot Password?
          </Link>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 rounded-full bg-neutral-900 text-white hover:bg-neutral-800 cursor-pointer"
        >
          {isSubmitting ? "Logging in..." : "Log in"}
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

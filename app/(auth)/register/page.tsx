"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

export default function RegisterPage() {
  const { register: authRegister } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(data: RegisterInput) {
    setError("");
    try {
      await authRegister(data.name, data.email, data.password);
    } catch (err: any) {
      setError(err.message);
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

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          label="Full Name"
          id="name"
          placeholder="Full Name"
          error={errors.name?.message}
          className="h-11 rounded-full bg-neutral-100 border-0 px-4"
          {...register("name")}
        />

        <FormField
          label="Email Address"
          id="email"
          type="email"
          placeholder="Email ID"
          error={errors.email?.message}
          className="h-11 rounded-full bg-neutral-100 border-0 px-4"
          {...register("email")}
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <FormField
              label="Password"
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              error={errors.password?.message}
              className="h-11 rounded-full bg-neutral-100 border-0 px-4 pr-9"
              {...register("password")}
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
              type={showConfirm ? "text" : "password"}
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              className="h-11 rounded-full bg-neutral-100 border-0 px-4 pr-9"
              {...register("confirmPassword")}
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
          disabled={isSubmitting}
          className="w-full h-11 rounded-full bg-neutral-900 text-white hover:bg-neutral-800 mt-2 cursor-pointer"
        >
          {isSubmitting ? "Creating account..." : "Create Account"}
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

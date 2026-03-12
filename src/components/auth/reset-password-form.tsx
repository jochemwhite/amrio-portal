"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";
import Link from "next/link";
import { ResetPassword } from "@/actions/auth";

const formSchema = z
  .object({
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "At least one uppercase letter")
      .regex(/[a-z]/, "At least one lowercase letter")
      .regex(/\d/, "At least one number")
      .regex(/[^A-Za-z0-9]/, "At least one special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof formSchema>;

function getPasswordStrength(password: string) {
  let score = 0;
  const feedback: string[] = [];

  if (password.length >= 8) score += 25;
  else feedback.push("At least 8 characters");
  if (/[A-Z]/.test(password)) score += 25;
  else feedback.push("One uppercase letter");
  if (/[a-z]/.test(password)) score += 25;
  else feedback.push("One lowercase letter");
  if (/\d/.test(password)) score += 12.5;
  else feedback.push("One number");
  if (/[^A-Za-z0-9]/.test(password)) score += 12.5;
  else feedback.push("One special character");

  const label = score >= 75 ? "Strong" : score >= 50 ? "Medium" : "Weak";
  const color =
    score >= 75
      ? "text-green-500"
      : score >= 50
        ? "text-yellow-500"
        : "text-red-500";

  return { score, feedback, label, color };
}

export default function ResetPasswordForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onChange",
  });

  const password = form.watch("password");
  const strength = getPasswordStrength(password || "");

  const onSubmit = async (data: FormData) => {
    setIsPending(true);
    setError("");

    const result = await ResetPassword(data.password);

    if (!result.success) {
      setError(result.error || "Failed to update password. Please try again.");
      setIsPending(false);
      return;
    }

    setIsSuccess(true);
    setIsPending(false);
  };

  // Success state
  if (isSuccess) {
    return (
      <div className="w-full space-y-5 text-center">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1f2f1f]">
            <CheckCircle className="h-6 w-6 text-green-500" />
          </div>
        </div>
        <div className="space-y-1">
          <h1 className="text-white font-bold text-xl">Password updated</h1>
          <p className="text-[#888] text-sm">
            Your password has been successfully updated.
          </p>
        </div>
        <Button asChild className="w-full">
          <Link href="/">Continue to login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5">
      <div className="space-y-1">
        <h1 className="text-white font-bold text-xl">Set new password</h1>
        <p className="text-[#888] text-sm">
          Choose a strong password for your account.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FieldGroup>
          {/* Password */}
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="password" className="text-[#aaa]">
                  New Password
                </FieldLabel>
                <div className="relative">
                  <Input
                    {...field}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    disabled={isPending}
                    aria-invalid={fieldState.invalid}
                    className="bg-[#222] border-[#333] text-white placeholder:text-[#555] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#aaa] transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Password strength */}
                {password && (
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#555]">Password strength</span>
                      <span className={strength.color}>{strength.label}</span>
                    </div>
                    <Progress value={strength.score} className="h-1.5" />
                    {strength.feedback.length > 0 && (
                      <ul className="text-xs text-[#555] space-y-0.5">
                        {strength.feedback.map((item, i) => (
                          <li key={i}>• {item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {fieldState.invalid && fieldState.error?.message && (
                  <FieldError>{fieldState.error.message}</FieldError>
                )}
              </Field>
            )}
          />

          {/* Confirm password */}
          <Controller
            name="confirmPassword"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="confirmPassword" className="text-[#aaa]">
                  Confirm Password
                </FieldLabel>
                <div className="relative">
                  <Input
                    {...field}
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm your new password"
                    disabled={isPending}
                    aria-invalid={fieldState.invalid}
                    className="bg-[#222] border-[#333] text-white placeholder:text-[#555] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#aaa] transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {fieldState.invalid && fieldState.error?.message && (
                  <FieldError>{fieldState.error.message}</FieldError>
                )}
              </Field>
            )}
          />
        </FieldGroup>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isPending || !form.formState.isValid}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating password...
            </>
          ) : (
            "Update password"
          )}
        </Button>
      </form>
    </div>
  );
}

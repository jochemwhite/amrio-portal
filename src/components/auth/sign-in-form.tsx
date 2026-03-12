"use client";

import { Login } from "@/actions/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { LoginSchema, LoginSchemaType } from "@/schemas/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconBrandGithub, IconBrandGoogle } from "@tabler/icons-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

export default function SignInForm() {
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  // Contextual expired link message based on type param
  const urlError = searchParams.get("error");
  const urlType = searchParams.get("type");

  const expiredMessage =
    urlError === "expired"
      ? urlType === "invite"
        ? "Your invite link has expired. Please contact your administrator."
        : urlType === "recovery"
        ? "Your password reset link has expired. Please request a new one."
        : "Your link has expired. Please try again."
      : null;

  const form = useForm<LoginSchemaType>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function loginUser(values: LoginSchemaType) {
    const result = await Login(values);
    if (result?.error) {
      setError(result.error);
      toast.error(result.error);
    }
  }

  return (
    <form className="my-8" onSubmit={form.handleSubmit(loginUser)}>

      {/* Expired link alert */}
      {expiredMessage && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{expiredMessage}</AlertDescription>
        </Alert>
      )}

      <FieldGroup>
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="email">Email Address</FieldLabel>
              <Input
                {...field}
                id="email"
                type="email"
                placeholder="john@example.com"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && fieldState.error?.message && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </Field>
          )}
        />

        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                {...field}
                id="password"
                type="password"
                placeholder="••••••••"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && fieldState.error?.message && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </Field>
          )}
        />
      </FieldGroup>

      {error && (
        <p className="text-red-500 text-sm mt-2 mb-4">{error}</p>
      )}

      <Button type="submit" className="w-full mt-6">
        Sign in →
      </Button>

      <div className="flex flex-col space-y-4 text-sm text-neutral-500 dark:text-neutral-400 mt-4">
        <Link href="/forgot-password">Forgot password?</Link>
      </div>

      <div className="bg-linear-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent my-8 h-px w-full" />

      <div className="flex flex-col space-y-4">
        <Button type="button" variant="outline" className="w-full flex items-center gap-2">
          <IconBrandGoogle className="h-4 w-4" />
          Continue with Google
        </Button>
        <Button type="button" variant="outline" className="w-full flex items-center gap-2">
          <IconBrandGithub className="h-4 w-4" />
          Continue with GitHub
        </Button>
      </div>
    </form>
  );
}
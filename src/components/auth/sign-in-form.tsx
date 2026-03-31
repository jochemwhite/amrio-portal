"use client";

import { Login } from "@/actions/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/supabaseClient";
import { LoginSchema, LoginSchemaType } from "@/schemas/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconBrandGoogle, IconBrandWindows } from "@tabler/icons-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

export default function SignInForm() {
  const [error, setError] = useState<string | null>(null);
  const [authAlert, setAuthAlert] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

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

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;

    if (!hash) {
      setAuthAlert(null);
      return;
    }

    const hashParams = new URLSearchParams(hash);
    const errorCode = hashParams.get("error_code");
    const errorDescription = hashParams.get("error_description");

    if (errorCode === "user_banned") {
      setAuthAlert(
        "This account is currently suspended. You cannot sign in right now. Please contact your administrator or Amrio support if you believe this is a mistake.",
      );
      return;
    }

    if (hashParams.get("error") === "access_denied") {
      setAuthAlert(
        errorDescription
          ? decodeURIComponent(errorDescription.replace(/\+/g, " "))
          : "Sign-in was denied. Please try again or contact support if the problem continues.",
      );
      return;
    }

    setAuthAlert(null);
  }, []);

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

  async function signInWithProvider(provider: "google" | "azure") {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });

    if (error) {
      setError(error.message);
      toast.error(error.message);
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

      {authAlert && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{authAlert}</AlertDescription>
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
        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center gap-2"
          onClick={() => void signInWithProvider("google")}
        >
          <IconBrandGoogle className="h-4 w-4" />
          Continue with Google
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center gap-2"
          onClick={() => void signInWithProvider("azure")}
        >
          <IconBrandWindows className="h-4 w-4" />
          Continue with Microsoft
        </Button>
      </div>
    </form>
  );
}

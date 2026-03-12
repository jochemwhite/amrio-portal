"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Loader2, CheckCircle } from "lucide-react";
import { ForgotPassword } from "@/actions/auth";

const formSchema = z.object({
  email: z.email("Please enter a valid email address."),
});

type FormValues = z.infer<typeof formSchema>;

export default function ForgotPasswordForm() {
  const [isPending, setIsPending] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: FormValues) => {
    setIsPending(true);
    setError(null);

    const result = await ForgotPassword(data.email);

    if (result.success) {
      setSubmittedEmail(data.email);
    } else {
      setError(result.error || "Something went wrong. Please try again.");
    }

    setIsPending(false);
  };

  // Success state
  if (submittedEmail) {
    return (
      <div className="w-full space-y-5 text-center">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1f2f1f]">
            <CheckCircle className="h-6 w-6 text-green-500" />
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-white font-bold text-xl">Check your email</h1>
          <p className="text-[#888] text-sm">
            We sent a reset link to{" "}
            <span className="text-[#aaa] font-medium">{submittedEmail}</span>
          </p>
        </div>

        <div className="rounded-lg bg-[#222] p-4 text-left text-xs text-[#666] space-y-1">
          <p className="text-[#888] mb-2">Didn&apos;t receive it?</p>
          <p>• Check your spam folder</p>
          <p>• Make sure the email address is correct</p>
          <p>• Wait a few minutes for the email to arrive</p>
        </div>

        <Button
          variant="outline"
          className="w-full bg-transparent border-[#333] text-[#aaa] hover:bg-[#222] hover:text-white"
          onClick={() => {
            setSubmittedEmail(null);
            form.reset();
          }}
        >
          Try a different email
        </Button>
      </div>
    );
  }

  // Form state
  return (
    <div className="w-full space-y-5">
      <div className="space-y-1">
        <h1 className="text-white font-bold text-xl">Reset your password</h1>
        <p className="text-[#888] text-sm">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FieldGroup>
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="email" className="text-[#aaa]">
                  Email Address
                </FieldLabel>
                <Input
                  {...field}
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  disabled={isPending}
                  aria-invalid={fieldState.invalid}
                  className="bg-[#222] border-[#333] text-white placeholder:text-[#555]"
                />
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

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending reset link...
            </>
          ) : (
            "Send reset link"
          )}
        </Button>
      </form>
    </div>
  );
}

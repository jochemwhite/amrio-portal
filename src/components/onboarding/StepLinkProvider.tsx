"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { IconBrandGoogle, IconBrandWindows } from "@tabler/icons-react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/supabaseClient";
import { onboardingPasswordSchema } from "@/schemas/onboarding";

type OnboardingPasswordFormValues = z.input<typeof onboardingPasswordSchema>;

interface StepLinkProviderProps {
  email: string;
  identities: Array<{ provider?: string }>;
  nextStep: number;
}

export function StepLinkProvider({
  email,
  identities,
  nextStep,
}: StepLinkProviderProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const form = useForm<OnboardingPasswordFormValues>({
    resolver: zodResolver(onboardingPasswordSchema),
    defaultValues: {
      password: "",
      confirm_password: "",
    },
  });

  const linkedProviders = new Set(
    identities
      .map((identity) => identity.provider?.toLowerCase())
      .filter((provider): provider is string => Boolean(provider)),
  );
  const hasLinkedSignInMethod =
    linkedProviders.has("google") || linkedProviders.has("azure");

  const nextUrl = `/onboarding?step=${nextStep}`;

  const handleOAuth = async (provider: "google" | "azure") => {
    const { error } = await supabase.auth.linkIdentity({
      provider,
      options: {
        redirectTo: `${window.location.origin}${nextUrl}`,
        scopes: "email",
      },
    });

    if (error) {
      toast.error(error.message);
    }
  };

  const handlePasswordSubmit = async (values: OnboardingPasswordFormValues) => {
    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Password updated");
    router.push(nextUrl);
    router.refresh();
  };

  const providerBadge = (isLinked: boolean) =>
    isLinked ? <CheckCircle2 className="size-4 text-emerald-600" /> : null;

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>Choose how you&apos;ll sign in going forward.</p>
        <p>
          You need to link Google or Microsoft, or set a password before you can
          continue.
        </p>
        <p>
          Use a Google or Microsoft account with the same email address as your
          invite: <span className="font-medium text-foreground">{email}</span>.
        </p>
      </div>

      <div className="grid gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 justify-between"
          onClick={() => void handleOAuth("google")}
        >
          <span className="flex items-center gap-3">
            <IconBrandGoogle className="size-4" />
            Google
          </span>
          {providerBadge(linkedProviders.has("google"))}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="h-12 justify-between"
          onClick={() => void handleOAuth("azure")}
        >
          <span className="flex items-center gap-3">
            <IconBrandWindows className="size-4" />
            Microsoft
          </span>
          {providerBadge(linkedProviders.has("azure"))}
        </Button>
      </div>

      <div className="rounded-xl border p-4">
        <p className="mb-4 font-medium">Continue with password</p>
        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(handlePasswordSubmit)}
          >
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirm_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="animate-spin" />
              ) : null}
              Save password
            </Button>
          </form>
        </Form>
      </div>

      {hasLinkedSignInMethod ? (
        <div className="flex justify-end">
          <Button onClick={() => router.push(nextUrl)}>Continue</Button>
        </div>
      ) : null}
    </div>
  );
}

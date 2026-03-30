"use client";

import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { completeOnboarding } from "@/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StepCompleteProps {
  userId: string;
  name: string;
  email: string;
  identities: Array<{ provider?: string }>;
  tenantName: string | null;
}

function getProviderLabel(identities: Array<{ provider?: string }>) {
  const providers = identities
    .map((identity) => identity.provider?.toLowerCase())
    .filter((provider): provider is string => Boolean(provider));

  if (providers.includes("google")) {
    return "Google";
  }

  if (providers.includes("azure")) {
    return "Microsoft";
  }

  if (providers.includes("email")) {
    return "Email/Password";
  }

  return "Not linked yet";
}

export function StepComplete({
  userId,
  name,
  email,
  identities,
  tenantName,
}: StepCompleteProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const providerLabel = useMemo(() => getProviderLabel(identities), [identities]);

  const handleComplete = async () => {
    setIsSubmitting(true);
    const result = await completeOnboarding(userId);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error ?? "Failed to complete onboarding");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">You&apos;re all set! 🎉</h2>
        <p className="text-sm text-muted-foreground">
          Your account is ready. Review the summary below and head into the dashboard.
        </p>
      </div>

      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <div className="flex items-center justify-between gap-4 border-b pb-3">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{name}</span>
          </div>
          <div className="flex items-center justify-between gap-4 border-b pb-3">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{email}</span>
          </div>
          <div className="flex items-center justify-between gap-4 border-b pb-3">
            <span className="text-muted-foreground">Provider linked</span>
            <span className="font-medium">{providerLabel}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Tenant</span>
            <span className="font-medium">{tenantName ?? "No organisation"}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => void handleComplete()} disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : null}
          Go to dashboard
        </Button>
      </div>
    </div>
  );
}

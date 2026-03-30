"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

function getErrorCopy(reason: string, type: string) {
  if (reason === "expired") {
    if (type === "recovery") {
      return {
        title: "Password reset link expired",
        description: "Your password reset link has expired.",
        details: [
          "Request a new password reset email from the forgot password page.",
          "Use the most recent email you receive, because older reset links stop working.",
        ],
      };
    }

    return {
      title: "Setup link expired",
      description: "Your account setup link has expired.",
      details: [
        "Ask your administrator to resend your invite email.",
        "Open the newest invite email you receive, because setup links expire and can only be used once.",
      ],
    };
  }

  if (reason === "missing-token") {
    return {
      title: "Verification link incomplete",
      description: "This link is incomplete or was copied incorrectly.",
      details: [
        "Open the email again and click the button directly from the message.",
        "If the problem continues, ask for a new email before trying again.",
      ],
    };
  }

  return {
    title: "Verification failed",
    description: "We could not verify this link.",
    details: [
      "Try opening the latest email again and click the button once more.",
      "If it still does not work, request a new email or contact your administrator for help.",
    ],
  };
}

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason") ?? "verification-failed";
  const type = searchParams.get("type") ?? "";
  const copy = getErrorCopy(reason, type);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 z-50">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>{copy.title}</CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border  p-4">
            <p className="text-sm font-medium">What you can do next</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {copy.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/">Go to login</Link>
          </Button>
          {/* {type === "recovery" ? (
            <Button asChild variant="outline">
              <Link href="/forgot-password">Request new reset link</Link>
            </Button>
          ) : null} */}
        </CardFooter>
      </Card>
    </div>
  );
}

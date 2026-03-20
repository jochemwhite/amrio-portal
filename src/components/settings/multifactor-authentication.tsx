"use client";

import { createClient } from "@/lib/supabase/supabaseClient";
import { AlertCircle, ShieldCheck } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Setup2fa from "./setup-2fa";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { useUserSession } from "@/providers/session-provider";
import Remove2fa from "./remove-2fa";

export default function MultifactorAuthentication() {
  const [isMfaVerified, setIsMfaVerified] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const { userSession } = useUserSession();
  const supabase = useMemo(() => createClient(), []);

  const refreshMfaStatus = useCallback(async () => {
    setIsChecking(true);
    setError("");
    try {
      const [{ data: aalData, error: aalError }, { data: factorsData, error: factorsError }] =
        await Promise.all([
          supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
          supabase.auth.mfa.listFactors(),
        ]);

      if (aalError) {
        throw new Error(aalError.message || "Unable to read MFA assurance level.");
      }

      if (factorsError) {
        throw new Error(factorsError.message || "Unable to read MFA factors.");
      }

      const hasVerifiedTotp = Boolean(
        factorsData?.totp?.some((factor) => factor.status === "verified"),
      );
      const aal2Session =
        aalData.currentLevel === "aal2" && aalData.nextLevel === "aal2";

      setIsMfaVerified(hasVerifiedTotp || aal2Session);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsMfaVerified(false);
    } finally {
      setIsChecking(false);
    }
  }, [supabase]);

  useEffect(() => {
    void refreshMfaStatus();
  }, [refreshMfaStatus, userSession]);

  const handleRemove2FA = () => {
    setOpen(true);
  };

  return (
    <Card className="overflow-hidden border-border/60 bg-card/80 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/70">
      <CardHeader className="space-y-1.5 pb-4">
        <CardTitle className="text-xl font-semibold tracking-tight">Account Security</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Protect your account with two-factor authentication
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isChecking ? (
          <div className="flex items-center gap-3 rounded-md border border-border/70 bg-muted/20 p-3 text-sm text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>Checking your 2FA status...</span>
          </div>
        ) : isMfaVerified ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <span className="text-emerald-700 dark:text-emerald-300">
                Two-factor authentication is enabled and active
              </span>
            </div>
            <Button variant="destructive" onClick={handleRemove2FA}>
              Remove 2FA
            </Button>
          </div>
        ) : (
          <Setup2fa
            onSuccess={() => {
              void refreshMfaStatus();
            }}
          />
        )}
      </CardContent>
      <Remove2fa
        open={open}
        onOpenChange={setOpen}
        onSuccess={() => {
          void refreshMfaStatus();
        }}
      />
    </Card>
  );
}

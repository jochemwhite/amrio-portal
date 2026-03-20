"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../ui/input-otp";
import { createClient } from "@/lib/supabase/supabaseClient";
import QRCode from "qrcode";
import { AlertCircle, Check, Clipboard } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface SetupProps {
  closeModal: () => void;
  onSuccess: () => void;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

function isFactorNotFoundError(error: unknown) {
  return getErrorMessage(error, "").toLowerCase().includes("factor not found");
}

function isMaxVerifiedFactorsError(error: unknown) {
  return getErrorMessage(error, "")
    .toLowerCase()
    .includes("maximum number of verified factors reached");
}

function svgToDataUrl(svg: string) {
  if (svg.trim().startsWith("data:image/")) {
    return svg;
  }
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function Setup({ closeModal, onSuccess }: SetupProps) {
  const [factorId, setFactorId] = useState("");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [copied, setCopied] = useState(false);

  const supabaseRef = useRef(createClient());
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const factorIdRef = useRef("");
  const isVerifiedRef = useRef(false);
  const isMountedRef = useRef(true);

  const generateUUID = useCallback((): string => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }

    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
      const random = (Math.random() * 16) | 0;
      const value = char === "x" ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    });
  }, []);

  const cleanupPendingFactor = useCallback(async () => {
    if (!factorIdRef.current || isVerifiedRef.current) {
      return;
    }

    const pendingFactorId = factorIdRef.current;
    try {
      const { error: cleanupError } =
        await supabaseRef.current.auth.mfa.unenroll({
          factorId: pendingFactorId,
        });

      if (cleanupError && !isFactorNotFoundError(cleanupError)) {
        console.error("Failed to clean up pending MFA factor:", cleanupError);
        return;
      }
    } catch (cleanupError) {
      if (!isFactorNotFoundError(cleanupError)) {
        console.error("Failed to clean up pending MFA factor:", cleanupError);
        return;
      }
    }

    factorIdRef.current = "";
    setFactorId("");
    setQr("");
    setSecret("");
    setVerifyCode("");
    setEnrolled(false);
  }, []);

  const enrollMFA = useCallback(async () => {
    try {
      setIsEnrolling(true);
      setError("");
      setCopied(false);
      setVerifyCode("");

      const { data: factorsData } =
        await supabaseRef.current.auth.mfa.listFactors();
      const hasVerifiedTotp = Boolean(
        factorsData?.totp?.some((factor) => factor.status === "verified"),
      );
      if (hasVerifiedTotp) {
        await supabaseRef.current.auth.refreshSession();
        onSuccess();
        closeModal();
        return;
      }

      const friendlyName = `Amrio Portal 2FA ${generateUUID()}`;

      const enrollResult = await supabaseRef.current.auth.mfa.enroll({
        factorType: "totp",
        friendlyName,
      });

      if (enrollResult.error || !enrollResult.data) {
        throw new Error(enrollResult.error?.message || "Enrollment failed.");
      }

      const { id: newFactorId, totp } = enrollResult.data;

      if (!totp.secret) {
        throw new Error("TOTP enrollment data is incomplete.");
      }

      let qrSource = "";
      if (totp.uri) {
        qrSource = await QRCode.toDataURL(totp.uri, {
          width: 320,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        });
      } else if (totp.qr_code) {
        qrSource = svgToDataUrl(totp.qr_code);
      } else {
        throw new Error("No scannable QR data was returned.");
      }

      if (!isMountedRef.current) {
        return;
      }

      factorIdRef.current = newFactorId;
      setFactorId(newFactorId);
      setQr(qrSource);
      setSecret(totp.secret);
      setEnrolled(true);
    } catch (err: unknown) {
      if (isMaxVerifiedFactorsError(err)) {
        await supabaseRef.current.auth.refreshSession();
        onSuccess();
        closeModal();
        return;
      }

      if (!isMountedRef.current) {
        return;
      }

      console.error("MFA enrollment and/or QR generation error:", err);
      setError(getErrorMessage(err, "Failed to set up 2FA. Please try again."));
    } finally {
      if (isMountedRef.current) {
        setIsEnrolling(false);
      }
    }
  }, [closeModal, generateUUID, onSuccess]);

  useEffect(() => {
    const supabase = supabaseRef.current;
    isMountedRef.current = true;

    void enrollMFA();

    return () => {
      isMountedRef.current = false;

      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
        copiedTimeoutRef.current = null;
      }

      const pendingFactorId = factorIdRef.current;
      factorIdRef.current = "";
      if (pendingFactorId && !isVerifiedRef.current) {
        void supabase.auth.mfa
          .unenroll({ factorId: pendingFactorId })
          .catch((cleanupError) => {
            if (!isFactorNotFoundError(cleanupError)) {
              console.error(
                "Failed to clean up pending MFA factor on unmount:",
                cleanupError,
              );
            }
          });
      }
    };
  }, [enrollMFA]);

  const handleCopySecret = useCallback(async () => {
    if (!secret) {
      return;
    }

    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);

      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }

      copiedTimeoutRef.current = setTimeout(() => {
        setCopied(false);
        copiedTimeoutRef.current = null;
      }, 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      setError("Failed to copy to clipboard.");
    }
  }, [secret]);

  const handleVerify = useCallback(async () => {
    const normalizedCode = verifyCode.replace(/\D/g, "").slice(0, 6);

    if (normalizedCode.length !== 6 || isPending || !factorId) {
      return;
    }

    setError("");
    setIsPending(true);

    try {
      const challengeResult = await supabaseRef.current.auth.mfa.challenge({
        factorId,
      });

      if (challengeResult.error || !challengeResult.data) {
        throw new Error(
          challengeResult.error?.message ||
            "Failed to create verification challenge.",
        );
      }

      const { error: verifyError } = await supabaseRef.current.auth.mfa.verify({
        factorId,
        challengeId: challengeResult.data.id,
        code: normalizedCode,
      });

      if (verifyError) {
        throw new Error(verifyError.message || "Invalid verification code.");
      }

      isVerifiedRef.current = true;
      await supabaseRef.current.auth.refreshSession();
      onSuccess();
    } catch (err: unknown) {
      console.error("MFA verification error:", err);
      setError(getErrorMessage(err, "Verification failed. Please try again."));
      setVerifyCode("");
    } finally {
      setIsPending(false);
    }
  }, [verifyCode, isPending, factorId, onSuccess]);

  const handleCancel = useCallback(async () => {
    if (isPending || isClosing) {
      return;
    }

    setIsClosing(true);

    try {
      await cleanupPendingFactor();
      closeModal();
    } catch (err) {
      console.error("Error while closing 2FA setup:", err);
      closeModal();
    } finally {
      setIsClosing(false);
    }
  }, [cleanupPendingFactor, closeModal, isClosing, isPending]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        void handleVerify();
      }
    },
    [handleVerify],
  );

  const canVerify =
    verifyCode.replace(/\D/g, "").length === 6 && !isPending && enrolled;
  const showError = Boolean(error) && !isEnrolling;

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Setup Two-Factor Authentication
        </h2>
      </div>

      {showError && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {isEnrolling ? (
        <div className="flex flex-col items-center py-8">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-center text-sm text-muted-foreground">
            Setting up your 2FA...
          </p>
        </div>
      ) : enrolled && qr ? (
        <div className="flex flex-col items-center space-y-4">
          {/* Supabase recommends rendering this QR as a normal image from the returned SVG/data URL. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qr}
            alt="MFA QR Code"
            className="h-56 w-56 border border-border bg-white p-2"
          />

          <div className="flex w-full flex-col items-center">
            <span className="text-sm font-medium text-foreground">
              Manual Entry Code:
            </span>
            <div className="mt-2 flex w-fit items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-2">
              <span
                className="font-mono text-sm break-all select-all"
                id="secret-code"
              >
                {secret}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={copied ? "Copied!" : "Copy secret code"}
                    className="ml-2 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    onClick={handleCopySecret}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Clipboard className="h-4 w-4" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {copied ? "Copied!" : "Copy to clipboard"}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <p className="max-w-sm text-center text-sm text-muted-foreground">
            Scan the QR code with your authenticator app or manually enter the
            code above.
          </p>

          <div className="w-full">
            <label
              htmlFor="verify-code"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Enter the 6-digit code from your authenticator app:
            </label>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={verifyCode}
                onChange={(value) =>
                  setVerifyCode(value.replace(/\D/g, "").slice(0, 6))
                }
                onKeyDown={handleKeyPress}
                className="w-full justify-center"
              >
                <InputOTPGroup>
                  {[...Array(6)].map((_, i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center py-8">
          <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
          <p className="text-center text-sm text-muted-foreground">
            Failed to generate 2FA setup. Please try again.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => void enrollMFA()}
            disabled={isEnrolling}
          >
            Try Again
          </Button>
        </div>
      )}

      <div className="mt-6 flex justify-end space-x-2">
        <Button
          variant="secondary"
          onClick={() => void handleCancel()}
          disabled={isPending || isClosing}
        >
          {isClosing ? "Closing..." : "Cancel"}
        </Button>
        {enrolled && (
          <Button
            onClick={() => void handleVerify()}
            disabled={!canVerify}
            className="min-w-[100px]"
          >
            {isPending ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Verifying...
              </div>
            ) : (
              "Enable 2FA"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

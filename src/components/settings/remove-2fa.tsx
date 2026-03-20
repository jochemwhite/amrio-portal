import React, { useMemo, useState } from "react";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import { createClient } from "@/lib/supabase/supabaseClient";
import { AlertCircle } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function Remove2fa({ open, onOpenChange, onSuccess }: Props) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const supabase = useMemo(() => createClient(), []);

  const handleDelete = async () => {
    if (isPending) {
      return;
    }

    setIsPending(true);
    setError("");
    await handleRemove2FA();
    setIsPending(false);
  };

  const handleRemove2FA = async () => {
    const { data: factorsData, error: factorsError } =
      await supabase.auth.mfa.listFactors();

    if (factorsError) {
      setError(factorsError.message || "Unable to load MFA factors.");
      return;
    }

    const verifiedTotpFactor = factorsData?.totp?.find(
      (factor) => factor.status === "verified",
    );

    if (!verifiedTotpFactor) {
      setError("No verified 2FA factor was found for this account.");
      return;
    }

    const { error: unenrollError } = await supabase.auth.mfa.unenroll({
      factorId: verifiedTotpFactor.id,
    });

    if (unenrollError) {
      if (!unenrollError.message.toLowerCase().includes("factor not found")) {
        setError(unenrollError.message || "Failed to remove 2FA.");
        return;
      }
    }

    const {
      data: { session },
    } = await supabase.auth.refreshSession();

    if (session) {
      onOpenChange(false);
      onSuccess();
    } else {
      setError("2FA was removed, but session refresh failed. Reload and try again.");
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Confirm Delete"
      description={`Are you sure you want to remove two-factor authentication (2FA)? This will make your account less secure. `}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? "Removing..." : "Remove 2FA"}
          </Button>
        </div>
      }
      contentClassName="max-w-sm"
    >
      <div className="py-2">
        <p>This will remove 2FA from your account.</p>
        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </Modal>
  );
}

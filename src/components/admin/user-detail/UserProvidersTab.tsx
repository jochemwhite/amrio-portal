"use client";

import { Mail, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { deleteMfaFactor, unlinkProvider } from "@/actions/users";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { UserIdentity, UserMfaFactor } from "@/types/user";
import { useState } from "react";

function providerLabel(provider: string) {
  return provider.replaceAll("_", " ");
}

function identityDisplay(identity: UserIdentity) {
  const data = identity.identity_data ?? {};
  if (typeof data.email === "string") return data.email;
  if (typeof data.user_name === "string") return data.user_name;
  if (typeof data.name === "string") return data.name;
  return "Unknown identity";
}

export function UserProvidersTab({
  userId,
  identities,
  mfaFactors,
}: {
  userId: string;
  identities: UserIdentity[];
  mfaFactors: UserMfaFactor[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [identityToUnlink, setIdentityToUnlink] = useState<UserIdentity | null>(null);
  const [factorToDelete, setFactorToDelete] = useState<UserMfaFactor | null>(null);

  const refresh = async () =>
    new Promise<void>((resolve) => {
      startTransition(() => {
        router.refresh();
        resolve();
      });
    });

  const handleUnlink = async () => {
    if (!identityToUnlink) return;
    const result = await unlinkProvider(userId, identityToUnlink);
    if (!result.success) {
      toast.error(result.error ?? "Failed to unlink provider");
      return;
    }
    toast.success("Provider unlinked");
    setIdentityToUnlink(null);
    await refresh();
  };

  const handleDeleteFactor = async () => {
    if (!factorToDelete) return;
    const result = await deleteMfaFactor(userId, factorToDelete.id);
    if (!result.success) {
      toast.error(result.error ?? "Failed to remove MFA factor");
      return;
    }
    toast.success("MFA factor removed");
    setFactorToDelete(null);
    await refresh();
  };

  return (
    <>
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {identities.length > 0 ? (
            identities.map((identity) => (
              <Card key={`${identity.provider}-${identity.id ?? identity.created_at}`}>
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="size-4" />
                    {providerLabel(identity.provider)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-4">
                  <div className="text-sm">{identityDisplay(identity)}</div>
                  <div className="text-sm text-muted-foreground">
                    Linked on {identity.created_at ? new Date(identity.created_at).toLocaleString() : "Unknown"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Last used {identity.last_sign_in_at ? new Date(identity.last_sign_in_at).toLocaleString() : "Never"}
                  </div>
                  {identities.length > 1 ? (
                    <Button variant="outline" onClick={() => setIdentityToUnlink(identity)}>
                      Unlink
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ))
          ) : (
            <Empty className="md:col-span-2">
              <EmptyHeader>
                <EmptyTitle>No linked providers</EmptyTitle>
                <EmptyDescription>This user only has a primary auth record and no extra identities.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>MFA Factors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {mfaFactors.length > 0 ? (
              mfaFactors.map((factor) => (
                <div key={factor.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-medium">
                      <Shield className="size-4" />
                      {factor.factor_type}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge className="ring-1">{factor.status ?? "unknown"}</Badge>
                      <span>{factor.created_at ? new Date(factor.created_at).toLocaleString() : "Unknown"}</span>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => setFactorToDelete(factor)}>
                    Unenroll
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No MFA enrolled.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!identityToUnlink} onOpenChange={(open) => (!open ? setIdentityToUnlink(null) : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink provider?</AlertDialogTitle>
            <AlertDialogDescription>
              The user will lose this sign-in method.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnlink}>
              {isPending ? "Unlinking..." : "Unlink"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!factorToDelete} onOpenChange={(open) => (!open ? setFactorToDelete(null) : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove MFA factor?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the factor from the user account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFactor}>
              {isPending ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

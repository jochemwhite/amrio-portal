"use client";

import { useRouter } from "next/navigation";
import { Copy, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { resetPasswordWithLink, resendVerificationEmail } from "@/actions/authentication/user-emails";
import { deleteUser, toggleSuspend } from "@/actions/users";
import { EditUserDialog } from "@/components/admin/EditUserDialog";
import { SetPasswordDialog } from "@/components/admin/user-detail/SetPasswordDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserDetailProfile, UserRoleOption } from "@/types/user";

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleString();
}

function initials(user: UserDetailProfile) {
  return [user.first_name?.[0], user.last_name?.[0]].filter(Boolean).join("").toUpperCase() || user.email[0]?.toUpperCase() || "U";
}

function statusClass(status: UserDetailProfile["status"]) {
  switch (status) {
    case "active":
      return "bg-emerald-500/10 text-emerald-700 ring-emerald-200";
    case "suspended":
      return "bg-red-500/10 text-red-700 ring-red-200";
    default:
      return "bg-orange-500/10 text-orange-700 ring-orange-200";
  }
}

export function UserOverviewTab({
  user,
  roleOptions,
}: {
  user: UserDetailProfile;
  roleOptions: UserRoleOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resetEmailOpen, setResetEmailOpen] = useState(false);
  const [setPasswordOpen, setSetPasswordOpen] = useState(false);

  const refresh = () =>
    new Promise<void>((resolve) => {
      startTransition(() => {
        router.refresh();
        resolve();
      });
    });

  const handleCopy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };

  const handleResetPassword = async () => {
    const result = await resetPasswordWithLink(user.email);
    if (!result.success) {
      toast.error(result.error ?? "Failed to generate password reset link");
      return;
    }
    if (result.data) {
      await navigator.clipboard.writeText(result.data);
      toast.success("Password reset link copied to clipboard");
      return;
    }
    toast.success("Password reset email sent");
  };

  const handleVerification = async () => {
    const result = await resendVerificationEmail(user.email);
    if (!result.success) {
      toast.error(result.error ?? "Failed to send verification email");
      return;
    }
    if (result.data) {
      await navigator.clipboard.writeText(result.data);
    }
    toast.success("Verification email sent");
  };

  const handleSuspend = async () => {
    const result = await toggleSuspend(user.id, user.status !== "suspended");
    if (!result.success) {
      toast.error(result.error ?? "Failed to update account status");
      return;
    }
    toast.success(user.status === "suspended" ? "User unsuspended" : "User suspended");
    await refresh();
  };

  const handleDelete = async () => {
    const result = await deleteUser(user.id);
    if (!result.success) {
      toast.error(result.error ?? "Failed to delete account");
      return;
    }
    toast.success("User deleted");
    router.push("/admin/users");
  };

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Profile</CardTitle>
              <CardDescription>Account details and onboarding state.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-start gap-4">
                <Avatar size="lg" className="size-16">
                  {user.avatar ? <AvatarImage src={user.avatar} alt={user.full_name} /> : null}
                  <AvatarFallback>{initials(user)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold">{user.full_name}</h2>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Button variant="outline" onClick={() => setEditOpen(true)}>
                      Edit
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Email</div>
                  <div className="flex items-center gap-2">
                    <span>{user.email}</span>
                    <Button size="icon-sm" variant="ghost" onClick={() => handleCopy(user.email, "Email")}>
                      <Copy />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Phone</div>
                  <div>{user.auth.phone || "No phone"}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Member since</div>
                  <div>{formatDate(user.created_at)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Last sign in</div>
                  <div>{formatDate(user.auth.last_sign_in_at)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Onboarding</div>
                  <Badge className={user.is_onboarded ? "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-200" : "bg-slate-500/10 text-slate-700 ring-1 ring-slate-200"}>
                    {user.is_onboarded ? "Onboarded" : "Not onboarded"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Account Status</CardTitle>
              <CardDescription>Control access, reset credentials, and delete the account.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <div className="font-medium">Current status</div>
                  <Badge className={`ring-1 ${statusClass(user.status)}`}>{user.status}</Badge>
                  {user.auth.banned_until ? (
                    <div className="text-sm text-muted-foreground">Banned until {formatDate(user.auth.banned_until)}</div>
                  ) : null}
                </div>
                <Button onClick={handleSuspend}>
                  {user.status === "suspended" ? "Unsuspend" : "Suspend"}
                </Button>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => setResetEmailOpen(true)}>
                  Send password reset email
                </Button>
                <Button variant="outline" onClick={() => setSetPasswordOpen(true)}>
                  Set password manually
                </Button>
                <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 pt-4">
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Tenants</div>
                <div className="text-2xl font-semibold">{user.tenant_memberships.length}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Global Roles</div>
                <div className="text-2xl font-semibold">{user.global_roles.length}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Providers</div>
                <div className="text-2xl font-semibold">{user.auth.identities.length}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">MFA Factors</div>
                <div className="text-2xl font-semibold">{user.auth.mfa_factors.length}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Email Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {user.auth.email_confirmed_at ? (
                <div className="text-sm">Verified on {formatDate(user.auth.email_confirmed_at)}</div>
              ) : (
                <Badge className="bg-slate-500/10 text-slate-700 ring-1 ring-slate-200">Not verified</Badge>
              )}
              <Button variant="outline" onClick={handleVerification}>
                Resend verification email
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <EditUserDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        user={user}
        roleOptions={roleOptions}
        onSuccess={refresh}
      />

      <SetPasswordDialog
        open={setPasswordOpen}
        onOpenChange={setSetPasswordOpen}
        userId={user.id}
      />

      <AlertDialog open={resetEmailOpen} onOpenChange={setResetEmailOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send password reset email?</AlertDialogTitle>
            <AlertDialogDescription>
              This will email a password reset link to {user.email}. The user can use it to choose a new password.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setResetEmailOpen(false);
                await handleResetPassword();
              }}
            >
              Send email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this account?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the user and removes access across the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              {isPending ? <Loader2 className="animate-spin" /> : null}
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

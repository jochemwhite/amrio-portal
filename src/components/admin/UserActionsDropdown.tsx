"use client";

import { Loader2, MoreHorizontal, ShieldAlert, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  deleteUser,
  resendInvite,
  resetPassword,
  toggleSuspend,
} from "@/app/actions/users";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminUser } from "@/types/user";

interface UserActionsDropdownProps {
  user: AdminUser;
  onEdit: (user: AdminUser) => void;
  onRefresh: () => Promise<void> | void;
}

type PendingAction = "reset" | "delete" | "suspend" | "resend" | null;

export function UserActionsDropdown({
  user,
  onEdit,
  onRefresh,
}: UserActionsDropdownProps) {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const isSuspended = user.status === "suspended";

  const handleResetPassword = async () => {
    setPendingAction("reset");
    const result = await resetPassword(user.email);
    setPendingAction(null);
    setConfirmResetOpen(false);

    if (!result.success) {
      toast.error(result.error ?? "Failed to send password reset email");
      return;
    }

    toast.success("Password reset email sent");
  };

  const handleDeleteUser = async () => {
    setPendingAction("delete");
    const result = await deleteUser(user.id);
    setPendingAction(null);
    setConfirmDeleteOpen(false);

    if (!result.success) {
      toast.error(result.error ?? "Failed to delete user");
      return;
    }

    toast.success("User deleted");
    await onRefresh();
  };

  const handleToggleSuspend = async () => {
    setPendingAction("suspend");
    const result = await toggleSuspend(user.id, !isSuspended);
    setPendingAction(null);

    if (!result.success) {
      toast.error(result.error ?? "Failed to update user status");
      return;
    }

    toast.success(isSuspended ? "User unsuspended" : "User suspended");
    await onRefresh();
  };

  const handleResendInvite = async () => {
    setPendingAction("resend");
    const result = await resendInvite({
      email: user.email,
      full_name: user.full_name,
      role: user.tenant_role,
    });
    setPendingAction(null);

    if (!result.success) {
      toast.error(result.error ?? "Failed to resend invite");
      return;
    }

    toast.success("User invited successfully");
    await onRefresh();
  };

  const isWorking = pendingAction !== null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" disabled={isWorking}>
            {isWorking ? <Loader2 className="animate-spin" /> : <MoreHorizontal />}
            <span className="sr-only">Open user actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            disabled={!user.is_in_current_tenant}
            onSelect={() => {
              if (user.is_in_current_tenant) {
                onEdit(user);
              }
            }}
          >
            Edit User
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setConfirmResetOpen(true)}>
            Reset Password
          </DropdownMenuItem>
          {user.status === "pending" ? (
            <DropdownMenuItem onSelect={handleResendInvite}>
              Resend Invite
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem onSelect={handleToggleSuspend}>
            {isSuspended ? (
              <>
                <ShieldCheck />
                Unsuspend
              </>
            ) : (
              <>
                <ShieldAlert />
                Suspend
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setConfirmDeleteOpen(true)}
          >
            <Trash2 />
            Delete User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmResetOpen} onOpenChange={setConfirmResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send password reset email?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a Supabase recovery link for {user.email}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pendingAction === "reset"}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={pendingAction === "reset"}
              onClick={handleResetPassword}
            >
              {pendingAction === "reset" ? <Loader2 className="animate-spin" /> : null}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the auth user for {user.email}. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pendingAction === "delete"}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pendingAction === "delete"}
              onClick={handleDeleteUser}
            >
              {pendingAction === "delete" ? <Loader2 className="animate-spin" /> : null}
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

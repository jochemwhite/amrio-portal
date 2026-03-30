"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { toast } from "sonner";

import { revokeAllSessions } from "@/actions/users";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UserSessionInfo } from "@/types/user";

function parseUserAgent(userAgent: string | null) {
  if (!userAgent) return "Unknown device";
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Safari")) return "Safari";
  if (userAgent.includes("Firefox")) return "Firefox";
  return "Unknown";
}

export function UserSessionsTab({
  userId,
  sessions,
  error,
}: {
  userId: string;
  sessions: UserSessionInfo[];
  error?: string;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const refresh = async () =>
    new Promise<void>((resolve) => {
      startTransition(() => {
        router.refresh();
        resolve();
      });
    });

  const handleRevokeAll = async () => {
    const result = await revokeAllSessions(userId);
    if (!result.success) {
      toast.error(result.error ?? "Failed to revoke sessions");
      return;
    }
    toast.success("All sessions revoked");
    setConfirmOpen(false);
    await refresh();
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{error}</CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Active Sessions</CardTitle>
            <Button variant="outline" onClick={() => setConfirmOpen(true)}>
              Revoke All Sessions
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {sessions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device / User Agent</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-default">{parseUserAgent(session.user_agent)}</span>
                        </TooltipTrigger>
                        <TooltipContent>{session.user_agent ?? "Unknown user agent"}</TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{session.ip_address ?? "Unknown"}</TableCell>
                    <TableCell>{session.created_at ? new Date(session.created_at).toLocaleString() : "Unknown"}</TableCell>
                    <TableCell>{session.updated_at ? new Date(session.updated_at).toLocaleString() : "Unknown"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No active sessions</EmptyTitle>
                <EmptyDescription>There are no sessions available for this user.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke all sessions?</AlertDialogTitle>
            <AlertDialogDescription>
              This will sign the user out everywhere.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleRevokeAll}>
              {isPending ? "Revoking..." : "Revoke all"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

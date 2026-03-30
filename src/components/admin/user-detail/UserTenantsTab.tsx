"use client";

import { useRouter } from "next/navigation";
import { MoreHorizontal, Plus, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { removeGlobalRole, removeUserFromTenant, updateUserTenantRole } from "@/app/actions/users";
import { AssignGlobalRoleDialog } from "@/components/admin/user-detail/AssignGlobalRoleDialog";
import { AssignTenantDialog } from "@/components/admin/user-detail/AssignTenantDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TenantOption, UserGlobalRoleAssignment, UserRoleOption, UserTenantDetail } from "@/types/user";

function tenantInitials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "T";
}

export function UserTenantsTab({
  userId,
  tenants,
  globalRoles,
  tenantOptions,
  roleOptions,
}: {
  userId: string;
  tenants: UserTenantDetail[];
  globalRoles: UserGlobalRoleAssignment[];
  tenantOptions: TenantOption[];
  roleOptions: UserRoleOption[];
}) {
  const router = useRouter();
  const [tenantDialogOpen, setTenantDialogOpen] = useState(false);
  const [globalRoleDialogOpen, setGlobalRoleDialogOpen] = useState(false);
  const [membershipToRemove, setMembershipToRemove] = useState<UserTenantDetail | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = () =>
    new Promise<void>((resolve) => {
      startTransition(() => {
        router.refresh();
        resolve();
      });
    });

  const handleRoleChange = async (tenantId: string, role: string) => {
    const result = await updateUserTenantRole(userId, tenantId, role);
    if (!result.success) {
      toast.error(result.error ?? "Failed to update role");
      return;
    }
    toast.success("Tenant role updated");
    await refresh();
  };

  const handleRemoveTenant = async () => {
    if (!membershipToRemove) return;
    const result = await removeUserFromTenant(userId, membershipToRemove.tenant_id);
    if (!result.success) {
      toast.error(result.error ?? "Failed to remove user from tenant");
      return;
    }
    toast.success("Removed from tenant");
    setMembershipToRemove(null);
    await refresh();
  };

  const handleRemoveGlobalRole = async (id: string) => {
    const result = await removeGlobalRole(id);
    if (!result.success) {
      toast.error(result.error ?? "Failed to remove global role");
      return;
    }
    toast.success("Global role removed");
    await refresh();
  };

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Tenant Memberships</CardTitle>
              <Button variant="outline" onClick={() => setTenantDialogOpen(true)}>
                <Plus />
                Assign to tenant
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {tenants.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Member Since</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((membership) => (
                    <TableRow key={membership.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            {membership.tenant_logo_url ? <AvatarImage src={membership.tenant_logo_url} alt={membership.tenant_name} /> : null}
                            <AvatarFallback>{tenantInitials(membership.tenant_name)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{membership.tenant_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select value={membership.role} onValueChange={(value) => handleRoleChange(membership.tenant_id, value)}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roleOptions.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{membership.created_at ? new Date(membership.created_at).toLocaleDateString() : "Unknown"}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon-sm" variant="ghost">
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setMembershipToRemove(membership)}>
                              Remove from tenant
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>No tenant memberships</EmptyTitle>
                  <EmptyDescription>This user is not assigned to any tenant yet.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Global Roles</CardTitle>
              <Button variant="outline" onClick={() => setGlobalRoleDialogOpen(true)}>
                <Plus />
                Assign global role
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 pt-4">
            {globalRoles.length > 0 ? (
              globalRoles.map((role) => (
                <Badge key={role.id} className="flex items-center gap-1 ring-1">
                  {role.role_name.replaceAll("_", " ")}
                  <button type="button" onClick={() => handleRemoveGlobalRole(role.id)} className="rounded-full p-0.5 hover:bg-black/10">
                    <X className="size-3" />
                  </button>
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">No global roles assigned.</span>
            )}
          </CardContent>
        </Card>
      </div>

      <AssignTenantDialog
        open={tenantDialogOpen}
        onOpenChange={setTenantDialogOpen}
        userId={userId}
        tenants={tenantOptions}
        roleOptions={roleOptions}
        onSuccess={refresh}
      />

      <AssignGlobalRoleDialog
        open={globalRoleDialogOpen}
        onOpenChange={setGlobalRoleDialogOpen}
        userId={userId}
        roleOptions={roleOptions}
        onSuccess={refresh}
      />

      <AlertDialog open={!!membershipToRemove} onOpenChange={(open) => (!open ? setMembershipToRemove(null) : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from tenant?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke the user&apos;s membership in {membershipToRemove?.tenant_name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleRemoveTenant}>
              {isPending ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

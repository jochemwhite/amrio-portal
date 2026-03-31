"use client";

import { format } from "date-fns";
import { Search, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { EditUserDialog } from "@/components/admin/EditUserDialog";
import { InviteUserDialog } from "@/components/admin/InviteUserDialog";
import { UserActionsDropdown } from "@/components/admin/UserActionsDropdown";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { AdminUser, UserRoleOption, UserStatus } from "@/types/user";

function getInitials(user: Pick<AdminUser, "first_name" | "last_name" | "email">) {
  const initials = [user.first_name?.[0], user.last_name?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase();

  return initials || user.email[0]?.toUpperCase() || "U";
}

function formatDate(value: string | null) {
  if (!value) {
    return "Never";
  }

  try {
    return format(new Date(value), "MMM d, yyyy");
  } catch {
    return "Unknown";
  }
}

function formatRoleLabel(role: string) {
  return role.replaceAll("_", " ");
}

function roleBadgeClass(role: string) {
  switch (role) {
    case "system_admin":
      return "bg-blue-500/10 text-blue-700 ring-blue-200 dark:text-blue-300";
    case "user":
      return "bg-slate-500/10 text-slate-700 ring-slate-200 dark:text-slate-300";
    default:
      return "bg-violet-500/10 text-violet-700 ring-violet-200 dark:text-violet-300";
  }
}

function statusBadgeClass(status: UserStatus) {
  switch (status) {
    case "active":
      return "bg-emerald-500/10 text-emerald-700 ring-emerald-200 dark:text-emerald-300";
    case "suspended":
      return "bg-red-500/10 text-red-700 ring-red-200 dark:text-red-300";
    default:
      return "bg-orange-500/10 text-orange-700 ring-orange-200 dark:text-orange-300";
  }
}

function TableSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border bg-background p-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="grid grid-cols-[2.5fr_2fr_1fr_1fr_1.25fr_48px] gap-3">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      ))}
    </div>
  );
}

interface UserTableProps {
  initialUsers: AdminUser[];
  roleOptions: UserRoleOption[];
}

export function UserTable({ initialUsers, roleOptions }: UserTableProps) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | UserStatus>("all");
  const [tenantFilter, setTenantFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "tenant">("name");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);

  const tenantOptions = useMemo(() => {
    const byTenantId = new Map<string, string>();

    initialUsers.forEach((user) => {
      user.tenant_memberships.forEach((membership) => {
        byTenantId.set(membership.tenant_id, membership.tenant_name);
      });
    });

    return [...byTenantId.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((left, right) => left.label.localeCompare(right.label));
  }, [initialUsers]);

  const globalRoleOptions = useMemo(() => {
    const roles = new Set<string>();

    initialUsers.forEach((user) => {
      if (user.role) {
        roles.add(user.role);
      }
    });

    return [...roles].sort((left, right) => left.localeCompare(right));
  }, [initialUsers]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return initialUsers
      .filter((user) => {
        const matchesSearch =
          query.length === 0 ||
          user.full_name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query);
        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        const matchesStatus = statusFilter === "all" || user.status === statusFilter;
        const matchesTenant =
          tenantFilter === "all" ||
          (tenantFilter === "no-tenant"
            ? user.tenant_memberships.length === 0
            : user.tenant_memberships.some((membership) => membership.tenant_id === tenantFilter));

        return matchesSearch && matchesRole && matchesStatus && matchesTenant;
      })
      .sort((left, right) => {
        if (sortBy === "tenant") {
          const leftTenant = left.primary_tenant_name ?? "ZZZ";
          const rightTenant = right.primary_tenant_name ?? "ZZZ";
          const tenantComparison = leftTenant.localeCompare(rightTenant);

          if (tenantComparison !== 0) {
            return tenantComparison;
          }
        }

        return left.full_name.localeCompare(right.full_name);
      });
  }, [initialUsers, roleFilter, search, sortBy, statusFilter, tenantFilter]);

  const refreshUsers = async () => {
    startRefresh(() => {
      router.refresh();
    });
  };

  return (
    <>
      <section className="space-y-6">
        <div className="flex flex-col gap-4 rounded-xl border bg-background p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">User Management</h1>
              <p className="text-sm text-muted-foreground">
                Manage invites, roles, and account status for portal users.
              </p>
            </div>
            <Button onClick={() => setInviteOpen(true)}>Invite User</Button>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by name or email"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Select
              value={roleFilter}
              onValueChange={setRoleFilter}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {globalRoleOptions.map((role) => (
                  <SelectItem key={role} value={role}>
                    {formatRoleLabel(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as "all" | UserStatus)}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tenantFilter} onValueChange={setTenantFilter}>
              <SelectTrigger className="w-full md:w-[220px]">
                <SelectValue placeholder="Filter by tenant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tenants</SelectItem>
                <SelectItem value="no-tenant">No tenant</SelectItem>
                {tenantOptions.map((tenant) => (
                  <SelectItem key={tenant.value} value={tenant.value}>
                    {tenant.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as "name" | "tenant")}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Sort users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Sort: Name</SelectItem>
                <SelectItem value="tenant">Sort: Tenant</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isRefreshing ? <TableSkeleton /> : null}

        <div className={cn("rounded-xl border bg-background", isRefreshing && "hidden")}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Avatar</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="w-[56px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Avatar className="size-9 border">
                        {user.avatar ? <AvatarImage src={user.avatar} alt={user.full_name} /> : null}
                        <AvatarFallback className="bg-muted text-xs font-medium">
                          {getInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/admin/users/${user.id}`} className="hover:underline">
                        {user.full_name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      {user.tenant_memberships.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.tenant_memberships.slice(0, 2).map((membership) => (
                            <Badge
                              key={`${user.id}-${membership.tenant_id}`}
                              className={cn(
                                "ring-1",
                                membership.is_current_tenant
                                  ? "bg-primary/10 text-primary ring-primary/20"
                                  : "bg-muted text-muted-foreground ring-border",
                              )}
                            >
                              {membership.tenant_name}
                            </Badge>
                          ))}
                          {user.tenant_memberships.length > 2 ? (
                            <Badge className="bg-muted text-muted-foreground ring-1 ring-border">
                              +{user.tenant_memberships.length - 2}
                            </Badge>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No tenant</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("capitalize ring-1", roleBadgeClass(user.role))}>
                        {formatRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("capitalize ring-1", statusBadgeClass(user.status))}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(user.last_sign_in_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <UserActionsDropdown
                        user={user}
                        onEdit={setEditUser}
                        onRefresh={refreshUsers}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="py-14 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Users className="size-8" />
                      <p className="text-sm font-medium text-foreground">
                        No users match the current filters
                      </p>
                      <p className="text-sm">
                        Adjust the search or filters to find a user.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <InviteUserDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        roleOptions={roleOptions}
        onSuccess={refreshUsers}
      />

      <EditUserDialog
        open={!!editUser}
        onOpenChange={(open) => {
          if (!open) {
            setEditUser(null);
          }
        }}
        user={editUser}
        roleOptions={roleOptions}
        onSuccess={refreshUsers}
      />
    </>
  );
}

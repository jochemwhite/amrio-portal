"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserDetailProfile } from "@/types/user";

function initials(user: UserDetailProfile) {
  return [user.first_name?.[0], user.last_name?.[0]].filter(Boolean).join("").toUpperCase() || user.email[0]?.toUpperCase() || "U";
}

function roleClass(role: string) {
  switch (role) {
    case "system_admin":
      return "bg-blue-500/10 text-blue-700 ring-blue-200 dark:text-blue-300";
    case "user":
      return "bg-slate-500/10 text-slate-700 ring-slate-200 dark:text-slate-300";
    default:
      return "bg-violet-500/10 text-violet-700 ring-violet-200 dark:text-violet-300";
  }
}

function statusClass(status: UserDetailProfile["status"]) {
  switch (status) {
    case "active":
      return "bg-emerald-500/10 text-emerald-700 ring-emerald-200 dark:text-emerald-300";
    case "suspended":
      return "bg-red-500/10 text-red-700 ring-red-200 dark:text-red-300";
    default:
      return "bg-orange-500/10 text-orange-700 ring-orange-200 dark:text-orange-300";
  }
}

export function UserDetailHeader({ user }: { user: UserDetailProfile }) {
  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" className="w-fit">
        <Link href="/dashboard/admin/users">
          <ArrowLeft />
          Back to users
        </Link>
      </Button>

      <div className="flex flex-col gap-4 rounded-xl border bg-background p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar size="lg" className="size-16">
            {user.avatar ? <AvatarImage src={user.avatar} alt={user.full_name} /> : null}
            <AvatarFallback>{initials(user)}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{user.full_name}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="flex flex-wrap gap-2">
              <Badge className={`ring-1 ${statusClass(user.status)}`}>{user.status}</Badge>
              <Badge className={`ring-1 ${roleClass(user.role)}`}>{user.role.replaceAll("_", " ")}</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

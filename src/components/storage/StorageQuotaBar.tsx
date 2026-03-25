"use client";

import { AlertTriangle, Database } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { StorageQuota } from "./types";
import { formatBytes } from "./utils";

interface StorageQuotaBarProps {
  quota: StorageQuota;
}

export function StorageQuotaBar({ quota }: StorageQuotaBarProps) {
  const percentage = quota.quotaBytes
    ? Math.min((quota.usedBytes / quota.quotaBytes) * 100, 100)
    : 0;
  const toneClass =
    percentage >= 95
      ? "[&_[data-slot=progress-indicator]]:bg-destructive"
      : percentage >= 80
        ? "[&_[data-slot=progress-indicator]]:bg-orange-500"
        : "";

  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-lg">Storage usage</CardTitle>
          <p className="text-sm text-muted-foreground">
            {quota.quotaBytes
              ? `${formatBytes(quota.usedBytes)} of ${formatBytes(quota.quotaBytes)} used`
              : `${formatBytes(quota.usedBytes)} used`}
          </p>
        </div>
        <div className="rounded-xl bg-muted p-3 text-muted-foreground">
          {percentage >= 80 ? (
            <AlertTriangle className="size-5" />
          ) : (
            <Database className="size-5" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={percentage} className={`h-3 ${toneClass}`} />
        <p className="text-xs text-muted-foreground">
          {percentage >= 95
            ? "Storage is nearly full. Delete or archive files soon."
            : percentage >= 80
              ? "Storage is getting tight. Keep an eye on upcoming uploads."
              : "You still have room for more uploads."}
        </p>
      </CardContent>
    </Card>
  );
}

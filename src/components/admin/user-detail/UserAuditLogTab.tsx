"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { DateRange } from "react-day-picker";
import { Filter } from "lucide-react";
import { toast } from "sonner";

import { getUserAuditLogs } from "@/app/actions/users";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserAuditLog, UserAuditLogFilters, UserAuditLogPage } from "@/types/user";

export function UserAuditLogTab({
  userId,
  initialData,
}: {
  userId: string;
  initialData: UserAuditLogPage;
}) {
  const [data, setData] = useState(initialData);
  const [selectedLog, setSelectedLog] = useState<UserAuditLog | null>(null);
  const [filters, setFilters] = useState<UserAuditLogFilters>({ actorMode: "both" });
  const [range, setRange] = useState<DateRange | undefined>();
  const [isPending, startTransition] = useTransition();
  const from = range?.from?.toISOString();
  const to = range?.to?.toISOString();
  const eventType = filters.eventType;
  const actorMode = filters.actorMode;

  useEffect(() => {
    startTransition(async () => {
      const result = await getUserAuditLogs(userId, 1, {
        eventType,
        actorMode,
        from,
        to,
      });
      if (result.success && result.data) {
        setData(result.data);
      } else if (!result.success) {
        toast.error(result.error ?? "Failed to load audit logs");
      }
    });
  }, [actorMode, eventType, from, to, userId]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(data.total / data.pageSize)), [data.pageSize, data.total]);

  const goToPage = async (page: number) => {
    const result = await getUserAuditLogs(userId, page, {
      eventType,
      actorMode,
      from,
      to,
    });
    if (!result.success || !result.data) {
      toast.error(result.error ?? "Failed to load audit logs");
      return;
    }
    setData(result.data);
  };

  return (
    <>
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Audit Log</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <Select
              value={filters.eventType ?? "all"}
              onValueChange={(value) => setFilters((current) => ({ ...current, eventType: value === "all" ? undefined : value }))}
            >
              <SelectTrigger className="w-full md:w-[220px]">
                <SelectValue placeholder="Filter by event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All event types</SelectItem>
                {data.eventTypes.map((eventType) => (
                  <SelectItem key={eventType} value={eventType}>
                    {eventType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.actorMode ?? "both"}
              onValueChange={(value) => setFilters((current) => ({ ...current, actorMode: value as "both" | "actor" | "subject" }))}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Role in event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both">Both</SelectItem>
                <SelectItem value="actor">Actor</SelectItem>
                <SelectItem value="subject">Subject</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <Filter />
                  {range?.from ? "Date range selected" : "Date range"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="range" selected={range} onSelect={setRange} numberOfMonths={2} />
              </PopoverContent>
            </Popover>
          </div>

          {data.items.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Role In Event</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <code className="rounded bg-muted px-2 py-1 text-xs">{log.event_type}</code>
                      </TableCell>
                      <TableCell>
                        {log.user_id === userId ? "Actor" : "Subject"}
                      </TableCell>
                      <TableCell>{log.ip_address ?? "Unknown"}</TableCell>
                      <TableCell>{log.created_at ? new Date(log.created_at).toLocaleString() : "Unknown"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" onClick={(event) => { event.preventDefault(); if (data.page > 1) void goToPage(data.page - 1); }} />
                  </PaginationItem>
                  <PaginationItem>
                    <span className="px-3 text-sm text-muted-foreground">Page {data.page} of {totalPages}</span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext href="#" onClick={(event) => { event.preventDefault(); if (data.page < totalPages) void goToPage(data.page + 1); }} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No audit logs</EmptyTitle>
                <EmptyDescription>No events match the current filters.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
          {isPending ? <div className="text-sm text-muted-foreground">Refreshing logs...</div> : null}
        </CardContent>
      </Card>

      <Sheet open={!!selectedLog} onOpenChange={(open) => (!open ? setSelectedLog(null) : null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{selectedLog?.event_type}</SheetTitle>
            <SheetDescription>Full audit log metadata</SheetDescription>
          </SheetHeader>
          <pre className="overflow-auto px-4 pb-4 text-xs">{JSON.stringify(selectedLog?.metadata ?? {}, null, 2)}</pre>
        </SheetContent>
      </Sheet>
    </>
  );
}

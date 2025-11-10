"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { Edit, Trash2, Archive, Play, MoreVertical, FileText, Calendar, Eye, Code2 } from "lucide-react";
import { PageStatus } from "@/types/cms";
import { DataTableColumnHeader } from "./page-table-column-header";
import { Database } from "@/types/supabase";
import { PageTypeGeneratorDialog } from "@/components/cms/page-type-generator/PageTypeGeneratorDialog";
import { useUserSession } from "@/providers/session-provider";

export type Page = {
  id: string;
  name: string;
  description?: string;
  slug: string;
  status: PageStatus;
  sections?: any[];
  updated_at?: string;
  created_at: string;
  website_id: string;
  cms_content_sections: number;
};

interface PageTableActionsProps {
  page: Database["public"]["Tables"]["cms_pages"]["Row"] & { cms_content_sections: number };
  onEdit: (pageId: string) => void;
  onEditSchema: (pageId: string) => void;
  onDelete: (pageId: string) => void;
  onStatusChange: (pageId: string, status: PageStatus) => void;
  websiteId: string;
}

function PageTableActions({ page, onEdit, onEditSchema, onDelete, onStatusChange, websiteId }: PageTableActionsProps) {
  const { userSession } = useUserSession();
  const isSystemAdmin = userSession?.global_roles?.some((role) => role === "system_admin");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(page.id)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEditSchema(page.id)}>
          <FileText className="mr-2 h-4 w-4" />
          Edit Schema
        </DropdownMenuItem>
        {isSystemAdmin && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <PageTypeGeneratorDialog 
                pageId={page.id} 
                websiteId={websiteId} 
                pageName={page.name} 
              />
            </div>
          </>
        )}
        <DropdownMenuSeparator />
        {page.status !== "active" && (
          <DropdownMenuItem onClick={() => onStatusChange(page.id, "active")}>
            <Play className="mr-2 h-4 w-4" />
            Activate
          </DropdownMenuItem>
        )}
        {page.status !== "archived" && (
          <DropdownMenuItem onClick={() => onStatusChange(page.id, "archived")}>
            <Archive className="mr-2 h-4 w-4" />
            Archive
          </DropdownMenuItem>
        )}
        {page.status !== "draft" && (
          <DropdownMenuItem onClick={() => onStatusChange(page.id, "draft")}>
            <Eye className="mr-2 h-4 w-4" />
            Set to Draft
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Page</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{page.name}"? This will permanently remove the page and all its schema data. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(page.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const createColumns = (
  onEdit: (pageId: string) => void,
  onEditSchema: (pageId: string) => void,
  onDelete: (pageId: string) => void,
  onStatusChange: (pageId: string, status: PageStatus) => void,
  websiteId: string
): ColumnDef<Database["public"]["Tables"]["cms_pages"]["Row"] & { cms_content_sections: number }>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.getValue("name")}</div>
        {row.original.description && (
          <div className="text-sm text-muted-foreground truncate max-w-[200px]">
            {row.original.description}
          </div>
        )}
      </div>
    ),
  },
  {
    accessorKey: "slug",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Slug" />,
    cell: ({ row }) => (
      <code className="text-sm bg-muted px-2 py-1 rounded">{row.getValue("slug")}</code>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.getValue("status") as PageStatus;
      const variants = {
        active: "default" as const,
        draft: "secondary" as const,
        archived: "outline" as const,
      };
      return <Badge variant={variants[status] || variants.draft}>{status}</Badge>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "sections",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Sections" />,
    cell: ({ row }) => {
      const sections = row.getValue("sections") as any[] | undefined;
      const sectionCount = Array.isArray(sections) ? sections.length : 0;
      return (
        <div className="flex items-center space-x-1">
          <span className="text-sm">{sectionCount}</span>
          <span className="text-xs text-muted-foreground">
            section{sectionCount !== 1 ? "s" : ""}
          </span>
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "updated_at",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Last Updated" />,
    cell: ({ row }) => {
      const updatedAt = row.getValue("updated_at") as string | undefined;
      return (
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="mr-1 h-3 w-3" />
          {updatedAt ? new Date(updatedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }) : "Never"}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div onClick={(e) => e.stopPropagation()}>
        <PageTableActions
          page={row.original}
          onEdit={onEdit}
          onEditSchema={onEditSchema}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
          websiteId={websiteId}
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
]; 
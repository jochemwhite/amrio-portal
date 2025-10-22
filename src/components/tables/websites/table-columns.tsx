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
import { Edit, Trash2, MoreVertical, Calendar, Globe, FileText } from "lucide-react";
import { DataTableColumnHeader } from "./website-table-column-header";
import { Database } from "@/types/supabase";
import { useRouter } from "next/navigation";

export type Website = Database["public"]["Tables"]["cms_websites"]["Row"];

interface WebsiteTableActionsProps {
  website: Website;
  onEdit: (websiteId: string) => void;
  onDelete: (websiteId: string) => void;
}

function WebsiteTableActions({ website, onEdit, onDelete }: WebsiteTableActionsProps) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push(`/dashboard/websites/${website.id}/pages`)}>
          <FileText className="mr-2 h-4 w-4" />
          Manage Pages
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onEdit(website.id)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Details
        </DropdownMenuItem>
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
              <AlertDialogTitle>Delete Website</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{website.name}"? This will permanently remove the website and all its pages. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(website.id)}
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
  onEdit: (websiteId: string) => void,
  onDelete: (websiteId: string) => void,
  onRowClick: (websiteId: string) => void
): ColumnDef<Website>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => (
      <div className="cursor-pointer" onClick={() => onRowClick(row.original.id)}>
        <div className="font-medium">{row.getValue("name")}</div>
        {row.original.description && (
          <div className="text-sm text-muted-foreground truncate max-w-[300px]">
            {row.original.description}
          </div>
        )}
      </div>
    ),
  },
  {
    accessorKey: "domain",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Domain" />,
    cell: ({ row }) => (
      <div className="flex items-center space-x-2 cursor-pointer" onClick={() => onRowClick(row.original.id)}>
        <Globe className="h-4 w-4 text-muted-foreground" />
        <code className="text-sm bg-muted px-2 py-1 rounded">{row.getValue("domain")}</code>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const variants = {
        active: "default" as const,
        inactive: "secondary" as const,
        maintenance: "outline" as const,
      };
      return (
        <div className="cursor-pointer" onClick={() => onRowClick(row.original.id)}>
          <Badge variant={variants[status as keyof typeof variants] || variants.inactive}>
            {status}
          </Badge>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
    cell: ({ row }) => {
      const createdAt = row.getValue("created_at") as string | undefined;
      return (
        <div className="flex items-center text-sm text-muted-foreground cursor-pointer" onClick={() => onRowClick(row.original.id)}>
          <Calendar className="mr-1 h-3 w-3" />
          {createdAt ? new Date(createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }) : "Unknown"}
        </div>
      );
    },
  },
  {
    accessorKey: "updated_at",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Last Updated" />,
    cell: ({ row }) => {
      const updatedAt = row.getValue("updated_at") as string | undefined;
      return (
        <div className="flex items-center text-sm text-muted-foreground cursor-pointer" onClick={() => onRowClick(row.original.id)}>
          <Calendar className="mr-1 h-3 w-3" />
          {updatedAt ? new Date(updatedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
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
        <WebsiteTableActions
          website={row.original}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
];


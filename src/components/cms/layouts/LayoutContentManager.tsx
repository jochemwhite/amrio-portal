"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LayoutRow } from "@/actions/cms/layout-actions";
import { Edit, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface LayoutContentManagerProps {
  initialLayouts: LayoutRow[];
  websiteId: string;
}

export function LayoutContentManager({ initialLayouts, websiteId }: LayoutContentManagerProps) {
  const router = useRouter();

  const handleRowClick = (layout: LayoutRow) => {
    router.push(`/dashboard/layouts/${layout.template_id}`);
  };

  const getAssignmentTypeDisplay = (layout: LayoutRow) => {
    switch (layout.assignment_type) {
      case 'default':
        return (
          <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
            Website Default
          </Badge>
        );
      case 'assignment':
        return (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Assignment Rule</Badge>
            {layout.condition_type && (
              <span className="text-xs text-muted-foreground">
                {formatConditionType(layout.condition_type)}
              </span>
            )}
          </div>
        );
      case 'override':
        return (
          <div className="flex flex-col gap-1">
            <Badge variant="outline">Page Override</Badge>
            {layout.page_name && (
              <span className="text-xs text-muted-foreground">
                {layout.page_name} ({layout.page_slug})
              </span>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const formatConditionType = (type: string) => {
    switch (type) {
      case 'all_pages':
        return 'All Pages';
      case 'specific_pages':
        return 'Specific Pages';
      case 'page_pattern':
        return 'Page Pattern';
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'header' 
      ? 'text-purple-600 dark:text-purple-400' 
      : 'text-green-600 dark:text-green-400';
  };

  if (initialLayouts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">No layouts configured</p>
          <p className="text-sm text-muted-foreground">
            Create header and footer templates to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Layout Templates</CardTitle>
          <CardDescription>
            All headers and footers with their assignments. Defaults are shown first.
            Click on a row to edit the content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Type</TableHead>
                <TableHead>Template Name</TableHead>
                <TableHead>Schema</TableHead>
                <TableHead>Assignment</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialLayouts.map((layout) => (
                <TableRow
                  key={layout.id}
                  className="cursor-pointer"
                  onClick={() => handleRowClick(layout)}
                >
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={getTypeColor(layout.type)}
                    >
                      {layout.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{layout.template_name}</span>
                      {layout.template_description && (
                        <span className="text-xs text-muted-foreground">
                          {layout.template_description}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {layout.schema_name}
                    </span>
                  </TableCell>
                  <TableCell>
                    {getAssignmentTypeDisplay(layout)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(layout);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

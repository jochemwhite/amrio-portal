"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import { RPCPageResponse } from "@/types/cms";
import { LayoutContentEditorClient } from "./layout_content_editor_client";

interface LayoutContentEditorProps {
  layoutEntryId: string;
  existingContent: RPCPageResponse;
  originalFields: {
    id: string;
    type: string;
    content: unknown;
    content_field_id?: string | null;
    collection_id?: string | null;
  }[];
  layoutType: string;
  layoutName: string;
  layoutDescription?: string | null;
}

export function LayoutContentEditor({
  layoutEntryId,
  existingContent,
  originalFields,
  layoutType,
  layoutName,
  layoutDescription,
}: LayoutContentEditorProps) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/dashboard/layouts">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Layouts
            </Button>
          </Link>
        </div>

        <div className="mb-6 space-y-1">
          <h1 className="text-2xl font-bold">
            Edit {layoutType}: {layoutName}
          </h1>
          <p className="text-muted-foreground">
            {layoutDescription || `Update the content for this ${layoutType} template`}
          </p>
        </div>

        <Separator className="my-6" />

        <LayoutContentEditorClient templateId={layoutEntryId} existingContent={existingContent} originalFields={originalFields} />
      </div>
    </div>
  );
}


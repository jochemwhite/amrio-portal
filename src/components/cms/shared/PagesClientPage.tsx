"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageOverview } from "./PageOverview";
import { PageForm } from "@/components/forms/PageForm";
import { Page } from "@/types/cms";
import { Database } from "@/types/supabase";

interface PagesClientPageProps {
  initialPages: Database["public"]["Tables"]["cms_pages"]["Row"][];
}

export function PagesClientPage({ initialPages }: PagesClientPageProps) {
  const router = useRouter();
  const [pages, setPages] = useState(initialPages);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPageId, setEditingPageId] = useState<string | undefined>();

  const handleCreatePage = () => {
    setEditingPageId(undefined);
    setIsFormOpen(true);
  };

  const handleEditPage = (pageId: string) => {
    setEditingPageId(pageId);
    setIsFormOpen(true);
  };

  const handleEditSchema = (pageId: string) => {
    // Navigate to schema builder
    router.push(`/dashboard/pages/${pageId}/schema`);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingPageId(undefined);
  };

  const handleFormSuccess = (page: Page) => {
    if (editingPageId) {
      // Update existing page
      setPages((prev) => prev.map((p) => (p.id === page.id ? (page as any) : p)));
    } else {
      // Add new page
      setPages((prev) => [...prev, page as any]);
    }
    handleFormClose();
  };

  return (
    <>
      <PageOverview pages={pages} onEditPage={handleEditPage} onEditSchema={handleEditSchema} />
    </>
  );
}

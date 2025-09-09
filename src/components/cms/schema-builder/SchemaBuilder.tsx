"use client";

import { Button } from "@/components/ui/button";
import { usePageBuilderStore } from "@/stores/usePageBuilderStore";
import { SupabasePageWithRelations } from "@/types/cms";
import { Plus } from "lucide-react";
import { useEffect } from "react";
import { CmsHeader } from "../shared/cmsHeader";
import { PageInfo } from "../shared/PageInfo";
import { PageSettingsDialog } from "../shared/PageSettingsDialog";
import { DraggableSectionsContainer } from "./DraggableSectionsContainer";
import { NoSectionCard } from "./NoSectionCard";
import { AddSectionMenu } from "./AddSectionMenu";
import { EditSectionMenu } from "./EditSectionMenu";
import { AddFieldMenu } from "./AddFieldMenu";

interface PayloadStylePageBuilderProps {
  initialPage: SupabasePageWithRelations;
  websiteId: string;
}

export function SchemaBuilder({ initialPage, websiteId }: PayloadStylePageBuilderProps) {
  const {
    sections,
    isSaving,
    // Page settings
    isPageSettingsOpen,
    pageSettingsData,
    // Actions
    initializeStore,
    // Page settings actions
    closePageSettings,
    setPageSettingsData,
    submitPageSettings,
    // Section actions
    openAddSectionDialog,
  } = usePageBuilderStore();

  // Initialize the store with page data
  useEffect(() => {
    initializeStore(initialPage, websiteId);
  }, [initialPage, websiteId, initializeStore]);

  const handlePageSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitPageSettings();
  };

  return (
    <div className="min-h-screen ">
      <CmsHeader />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <PageInfo />

        <div className="flex items-center justify-end mb-4">
          <Button onClick={() => openAddSectionDialog()} className="">
            <Plus className="mr-2 h-4 w-4" />
            Add Section
          </Button>
        </div>

        {/* Content sections */}
        {sections.length === 0 ? <NoSectionCard /> : <DraggableSectionsContainer />}
      </div>

      <PageSettingsDialog
        isOpen={isPageSettingsOpen}
        isSaving={isSaving}
        formData={pageSettingsData}
        onChange={setPageSettingsData}
        onClose={closePageSettings}
        onSubmit={handlePageSettingsSubmit}
      />

      <AddFieldMenu />
      <AddSectionMenu />
      <EditSectionMenu />
    </div>
  );
}

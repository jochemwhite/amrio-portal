"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { usePageBuilderStore } from "@/stores/usePageBuilderStore";

export const NoSectionCard = () => {
  const { openAddSectionDialog } = usePageBuilderStore();

  
  return (
    <Card className="border-2 border-dashed ">
      <CardContent className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <Plus className="mx-auto h-12 w-12" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No content sections yet</h3>
        <p className="text-gray-500 mb-4">Get started by adding your first content section</p>
        <Button onClick={() => openAddSectionDialog()} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="mr-2 h-4 w-4" />
          Add Your First Section
        </Button>
      </CardContent>
    </Card>
  );
};

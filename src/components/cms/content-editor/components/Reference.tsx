"use client";

import { useContentEditorStore } from "@/stores/useContentEditorStore";


export default function Reference({ field, fieldId, value, error, handleFieldChange, handleFieldBlur }: any) {
  const { getFieldCollectionId } = useContentEditorStore();
  const collectionId = getFieldCollectionId(fieldId);








  return (
    <div>
      <p>Collection ID: {collectionId || "No collection selected"}</p>
    </div>
  );
}
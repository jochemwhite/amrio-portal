"use client";
import Tiptap from "@/components/rich-editor/tiptap";
import React, { useState } from "react";

export default function page() {
  const [value, setValue] = useState(null);
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Tiptap value={value} onChange={setValue} />
    </div>
  );
}

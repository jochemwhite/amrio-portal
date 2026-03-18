import { cn } from "@/lib/utils";
import { useDraggable } from "@dnd-kit/react";

interface DraggableSidebarItemProps {
  page: any;
  type: "internal" | "external" | "dropdown";
  label: string;
  children: React.ReactNode;
}

export function DraggableSidebarItem({
  page,
  type,
  label,
  children,
}: DraggableSidebarItemProps) {
  const { ref, isDragging } = useDraggable({
    id: `sidebar-${type}-${page?.id || "custom"}`,
    data: {
      type: "SidebarItem",
      item: {
        id: `temp-${Date.now()}`,
        label,
        type,
        pageId: page?.id,
        url: page ? `/${page.slug}` : type === "dropdown" ? "#" : "https://",
        children: [],
      },
    },
  });

  return (
    <div ref={ref} className={cn(isDragging && "opacity-50")}>
      {children}
    </div>
  );
}

import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface DraggableSidebarItemProps {
  page: any;
  type: "internal" | "external" | "dropdown";
  label: string;
  children: React.ReactNode;
}

export function DraggableSidebarItem({ page, type, label, children }: DraggableSidebarItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `sidebar-${type}-${page?.id || "custom"}`,
    data: {
      type: "SidebarItem",
      item: {
        id: `temp-${Date.now()}`, // Temp ID
        label: label,
        type: type,
        pageId: page?.id,
        url: page ? `/${page.slug}` : (type === "dropdown" ? "#" : "https://"),
        children: []
      }
    }
  });

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={cn(isDragging ? "opacity-50" : "")}>
      {children}
    </div>
  );
}


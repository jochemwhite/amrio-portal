import { cn } from "@/lib/utils";

export function DropIndicator({ active }: { active: boolean }) {
  return (
    <div aria-hidden="true" className={cn("overflow-hidden", active ? "mb-2 max-h-16 opacity-100" : "mb-0 max-h-0 opacity-0")}>
      <div className="rounded-md border border-dashed border-primary/60 bg-primary/10 px-3 py-4 text-xs text-primary">
        Drop here
      </div>
    </div>
  );
}

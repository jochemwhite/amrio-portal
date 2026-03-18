"use client"

import { Settings2 } from "lucide-react"

import { Button } from "@/components/ui/button"

export function SchemaBuilderHeader({
  description,
  onOpenSettings,
  title,
}: {
  description?: string | null
  onOpenSettings: () => void
  title: string
}) {
  return (
    <section className="rounded-[28px] border border-white/8 bg-white/5 px-6 py-7 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:px-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.32em] text-slate-400">
            Content Model
          </p>
          <h1 className="mt-3 font-(--font-display) text-4xl tracking-tight text-white sm:text-[2.55rem]">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400 sm:text-base">
            {description ||
              "Reorder sections and fields, move them across containers, and drop them into nested sections."}
          </p>
        </div>
        <Button
          variant="outline"
          size="lg"
          className="gap-2  border-white/10 bg-white/3 px-4 text-white hover:bg-white/8"
          onClick={onOpenSettings}
        >
          <Settings2 className="size-4" />
          Settings
        </Button>
      </div>
    </section>
  )
}

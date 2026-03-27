"use client"

import { Lock } from "lucide-react"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function DepthIndicator() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
            <Lock className="size-3.5" />
            <span className="sr-only">Max depth reached</span>
          </span>
        </TooltipTrigger>
        <TooltipContent sideOffset={6}>Max depth reached</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

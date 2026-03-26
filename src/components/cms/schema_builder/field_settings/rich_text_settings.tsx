"use client"

import { Switch } from "@/components/ui/switch"
import {
  getRichTextAllowedNodesFromSettings,
  RICH_TEXT_ALLOWED_NODE_GROUPS,
  type RichTextAllowedNode,
} from "@/utils/schema/rich_text_nodes"

type RichTextSettingsProps = {
  value: Record<string, unknown> | null
  setValue: (value: Record<string, unknown> | null) => void
  open?: boolean
  collectionId?: string | null
  setCollectionId?: (value: string | null) => void
  error?: string | null
  onCollectionTouched?: () => void
}

export function RichTextSettings({ value, setValue }: RichTextSettingsProps) {
  const allowedNodes = getRichTextAllowedNodesFromSettings(value)

  function handle_toggle(node: RichTextAllowedNode, enabled: boolean) {
    const nextAllowedNodes = enabled
      ? [...allowedNodes, node]
      : allowedNodes.filter((candidate) => candidate !== node)

    setValue({
      ...(value ?? {}),
      allowedNodes: nextAllowedNodes,
    })
  }

  return (
    <div className="space-y-3 rounded-lg border border-white/10 p-3">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">Allowed Nodes</p>
        <p className="text-xs text-muted-foreground">
          Document, Paragraph, Text, and History are always included.
        </p>
      </div>

      <div className="space-y-4">
        {RICH_TEXT_ALLOWED_NODE_GROUPS.map((group) => (
          <div key={group.title} className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {group.title}
            </p>

            <div className="space-y-2">
              {group.options.map((option) => (
                <div
                  key={option.key}
                  className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2"
                >
                  <div className="pr-4">
                    <p className="text-sm font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                  <Switch
                    checked={allowedNodes.includes(option.key)}
                    onCheckedChange={(checked) => handle_toggle(option.key, checked)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

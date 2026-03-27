"use client"

import {
  Globe,
  Home,
  Info,
  Mail,
  Phone,
  User,
  Users,
  Briefcase,
  FileText,
  Folder,
  Settings,
  Search,
  ShoppingBag,
  ShoppingCart,
  BookOpen,
  Calendar,
  Camera,
  Heart,
  Image,
  LayoutGrid,
  Link as LinkIcon,
  MapPin,
  MessageCircle,
  Newspaper,
  Shield,
  Star,
  Sun,
  Tag,
  Ticket,
  Wrench,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

import type { NavItemDraft } from "./nav-builder.types"

const ICON_OPTIONS = [
  { name: "home", icon: Home },
  { name: "info", icon: Info },
  { name: "mail", icon: Mail },
  { name: "phone", icon: Phone },
  { name: "user", icon: User },
  { name: "users", icon: Users },
  { name: "briefcase", icon: Briefcase },
  { name: "file-text", icon: FileText },
  { name: "folder", icon: Folder },
  { name: "settings", icon: Settings },
  { name: "search", icon: Search },
  { name: "shopping-bag", icon: ShoppingBag },
  { name: "shopping-cart", icon: ShoppingCart },
  { name: "book-open", icon: BookOpen },
  { name: "calendar", icon: Calendar },
  { name: "camera", icon: Camera },
  { name: "heart", icon: Heart },
  { name: "image", icon: Image },
  { name: "layout-grid", icon: LayoutGrid },
  { name: "link", icon: LinkIcon },
  { name: "map-pin", icon: MapPin },
  { name: "message-circle", icon: MessageCircle },
  { name: "newspaper", icon: Newspaper },
  { name: "shield", icon: Shield },
  { name: "star", icon: Star },
  { name: "sun", icon: Sun },
  { name: "tag", icon: Tag },
  { name: "ticket", icon: Ticket },
  { name: "wrench", icon: Wrench },
] satisfies Array<{ name: string; icon: LucideIcon }>

export function NavItemForm({
  draft,
  onCancel,
  onChange,
  onSave,
}: {
  draft: NavItemDraft
  onCancel: () => void
  onChange: (patch: Partial<NavItemDraft>) => void
  onSave: () => void
}) {
  const selectedIcon = ICON_OPTIONS.find((option) => option.name === draft.icon)
  const SelectedIcon = selectedIcon?.icon

  return (
    <div className="rounded-lg border border-dashed bg-muted/20 p-4">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="nav-item-label">
            Label
          </label>
          <Input
            id="nav-item-label"
            value={draft.label}
            onChange={(event) => onChange({ label: event.target.value })}
            placeholder="About us"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="nav-item-href">
            URL
          </label>
          <InputGroup>
            <InputGroupAddon>
              <InputGroupText>
                <Globe className="size-4" />
              </InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              id="nav-item-href"
              value={draft.href}
              onChange={(event) => onChange({ href: event.target.value })}
              placeholder="/about"
            />
          </InputGroup>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Open in new tab</p>
            <p className="text-xs text-muted-foreground">
              External links can open in a separate browser tab.
            </p>
          </div>
          <Switch
            checked={draft.target === "_blank"}
            onCheckedChange={(checked) => onChange({ target: checked ? "_blank" : "_self" })}
          />
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-medium">Icon</label>
            {SelectedIcon ? (
              <Badge variant="outline" className="gap-1.5">
                <SelectedIcon className="size-3.5" />
                {selectedIcon?.name}
              </Badge>
            ) : (
              <Badge variant="outline">No icon</Badge>
            )}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-between">
                <span className="flex items-center gap-2">
                  {SelectedIcon ? <SelectedIcon className="size-4" /> : <LayoutGrid className="size-4" />}
                  {selectedIcon ? "Change icon" : "Choose icon"}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-80 p-0">
              <div className="flex items-center justify-between px-3 pt-3">
                <p className="text-sm font-medium">Icon picker</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange({ icon: undefined })}
                >
                  Clear
                </Button>
              </div>
              <Separator className="mt-3" />
              <ScrollArea className="h-64 p-3">
                <div className="grid grid-cols-3 gap-2 pr-3 sm:grid-cols-4">
                  {ICON_OPTIONS.map(({ name, icon: Icon }) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => onChange({ icon: name })}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-lg border px-2 py-3 text-xs transition hover:bg-accent",
                        draft.icon === name && "border-primary bg-accent text-accent-foreground"
                      )}
                    >
                      <Icon className="size-4" />
                      <span className="line-clamp-2 text-center">{name}</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save</Button>
        </div>
      </div>
    </div>
  )
}

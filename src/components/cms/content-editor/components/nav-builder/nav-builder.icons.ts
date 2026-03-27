import { createElement } from "react"
import {
  BookOpen,
  Briefcase,
  Calendar,
  Camera,
  FileText,
  Folder,
  Heart,
  Home,
  Image,
  Info,
  LayoutGrid,
  Link as LinkIcon,
  Mail,
  MapPin,
  MessageCircle,
  Newspaper,
  Phone,
  Search,
  Settings,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Star,
  Sun,
  Tag,
  Ticket,
  User,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react"

const NAV_ITEM_ICONS: Record<string, LucideIcon> = {
  "book-open": BookOpen,
  briefcase: Briefcase,
  calendar: Calendar,
  camera: Camera,
  "file-text": FileText,
  folder: Folder,
  heart: Heart,
  home: Home,
  image: Image,
  info: Info,
  "layout-grid": LayoutGrid,
  link: LinkIcon,
  mail: Mail,
  "map-pin": MapPin,
  "message-circle": MessageCircle,
  newspaper: Newspaper,
  phone: Phone,
  search: Search,
  settings: Settings,
  shield: Shield,
  "shopping-bag": ShoppingBag,
  "shopping-cart": ShoppingCart,
  star: Star,
  sun: Sun,
  tag: Tag,
  ticket: Ticket,
  user: User,
  users: Users,
  wrench: Wrench,
}

export function getNavItemIcon(name?: string) {
  if (!name) {
    return null
  }

  return NAV_ITEM_ICONS[name] ?? null
}

export function renderNavItemIcon(name: string | undefined, className: string) {
  const Icon = getNavItemIcon(name)

  if (!Icon) {
    return null
  }

  return createElement(Icon, { className })
}

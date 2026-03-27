export type NavItemTarget = "_self" | "_blank"

export type NavItem = {
  id: string
  label: string
  href: string
  target: NavItemTarget
  icon?: string
  children?: NavItem[]
}

export type NavMenu = {
  id: string
  name: string
  tenantId: string
  items: NavItem[]
  updatedAt: string
}

export type CmsPage = {
  id: string
  title: string
  slug: string
  parentId?: string
}

export type NavItemDraft = Pick<NavItem, "label" | "href" | "target" | "icon">

export interface NavBuilderProps {
  tenantId: string
  initialMenu?: NavMenu
  availablePages?: CmsPage[]
  onSave: (menu: NavMenu) => Promise<void>
  onPublish?: (menu: NavMenu) => Promise<void>
  isLoading?: boolean
  maxDepth?: number
}

export type DropState = {
  overId: string | null
}

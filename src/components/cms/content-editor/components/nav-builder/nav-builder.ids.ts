const ROOT_PREFIX = "nav-root-"
const CHILD_PREFIX = "nav-child-"
const ROOT_ZONE_ID = "dropzone-root"
const CHILD_ZONE_PREFIX = "dropzone-child-"
const PAGE_PREFIX = "page-"

const UUID_SOURCE =
  "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
const CHILD_ITEM_PATTERN = new RegExp(`^${CHILD_PREFIX}(${UUID_SOURCE})-(${UUID_SOURCE})$`)

export type ParsedNavId =
  | { type: "ROOT_ITEM"; itemId: string }
  | { type: "CHILD_ITEM"; parentId: string; itemId: string }
  | { type: "ROOT_ZONE" }
  | { type: "CHILD_ZONE"; parentId: string }
  | { type: "PAGE"; pageId: string }
  | { type: "UNKNOWN" }

export const NavIds = {
  root: (id: string) => `${ROOT_PREFIX}${id}`,
  child: (parentId: string, id: string) => `${CHILD_PREFIX}${parentId}-${id}`,
  rootZone: () => ROOT_ZONE_ID,
  childZone: (parentId: string) => `${CHILD_ZONE_PREFIX}${parentId}`,
  page: (id: string) => `${PAGE_PREFIX}${id}`,
  parse: (dndId: string): ParsedNavId => {
    if (dndId.startsWith(ROOT_PREFIX)) {
      return {
        type: "ROOT_ITEM",
        itemId: dndId.slice(ROOT_PREFIX.length),
      }
    }

    const childMatch = dndId.match(CHILD_ITEM_PATTERN)
    if (childMatch) {
      return {
        type: "CHILD_ITEM",
        parentId: childMatch[1],
        itemId: childMatch[2],
      }
    }

    if (dndId === ROOT_ZONE_ID) {
      return { type: "ROOT_ZONE" }
    }

    if (dndId.startsWith(CHILD_ZONE_PREFIX)) {
      return {
        type: "CHILD_ZONE",
        parentId: dndId.slice(CHILD_ZONE_PREFIX.length),
      }
    }

    if (dndId.startsWith(PAGE_PREFIX)) {
      return {
        type: "PAGE",
        pageId: dndId.slice(PAGE_PREFIX.length),
      }
    }

    return { type: "UNKNOWN" }
  },
}

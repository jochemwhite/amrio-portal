import { MenuItem } from "@/types/cms";
import { arrayMove } from "@dnd-kit/sortable";

export interface FlattenedMenuItem extends MenuItem {
  parentId: string | null;
  depth: number;
  index: number;
}

export function flatten(
  items: MenuItem[],
  parentId: string | null = null,
  depth = 0
): FlattenedMenuItem[] {
  return items.reduce<FlattenedMenuItem[]>((acc, item, index) => {
    return [
      ...acc,
      { ...item, parentId, depth, index },
      ...flatten(item.children || [], item.id, depth + 1),
    ];
  }, []);
}

export function findItem(items: MenuItem[], itemId: string): MenuItem | undefined {
  for (const item of items) {
    if (item.id === itemId) {
      return item;
    }
    if (item.children) {
      const found = findItem(item.children, itemId);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
}

export function findItemDeep(
  items: MenuItem[],
  itemId: string
): { item: MenuItem; index: number; parent: MenuItem | null; parentItems: MenuItem[] } | undefined {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.id === itemId) {
      return { item, index: i, parent: null, parentItems: items };
    }
    if (item.children) {
      const found = findItemDeep(item.children, itemId);
      if (found) {
        return { ...found, parent: item.id === found.parent?.id ? item : found.parent, parentItems: found.parent ? found.parentItems : item.children };
      }
    }
  }
  return undefined;
}

export function removeItem(items: MenuItem[], id: string): MenuItem[] {
  const newItems: MenuItem[] = [];

  for (const item of items) {
    if (item.id === id) {
      continue;
    }

    if (item.children && item.children.length > 0) {
      item.children = removeItem(item.children, id);
    }

    newItems.push(item);
  }

  return newItems;
}

export function setProperty<T extends keyof MenuItem>(
  items: MenuItem[],
  id: string,
  property: T,
  setter: (value: MenuItem[T]) => MenuItem[T]
): MenuItem[] {
  for (const item of items) {
    if (item.id === id) {
      item[property] = setter(item[property]);
      continue;
    }

    if (item.children && item.children.length > 0) {
      item.children = setProperty(item.children, id, property, setter);
    }
  }

  return [...items];
}

function countChildren(item: MenuItem): number {
  if (!item.children) return 0;
  return item.children.length + item.children.reduce((acc, child) => acc + countChildren(child), 0);
}

export function getChildCount(items: MenuItem[], id: string): number {
  const item = findItem(items, id);
  return item ? countChildren(item) : 0;
}

export function getMaxDepth(item: MenuItem): number {
  if (!item.children || item.children.length === 0) {
    return 0;
  }
  return 1 + Math.max(...item.children.map(getMaxDepth));
}

export function getProjectedDepth(
  items: MenuItem[],
  activeId: string,
  overId: string,
  newParentId: string | null
): number {
  const activeItem = findItem(items, activeId);
  const overItem = findItem(items, overId);
  
  if (!activeItem || !overItem) return 0;

  // This is a simplified projection. 
  // In a real DND sortable tree, we'd calculate based on offset.
  // For this specific requirement, we rely on explicit parent targeting.
  return 0; 
}

export function buildTree(flattenedItems: FlattenedMenuItem[]): MenuItem[] {
  const root: MenuItem = { id: "root", children: [], label: "", url: "", type: "internal", target: "_self", visible: true, order: 0 };
  const nodes: Record<string, MenuItem> = { [root.id]: root };
  const items = flattenedItems.map((item) => ({ ...item, children: [] }));

  for (const item of items) {
    const { id, children } = item;
    const parentId = item.parentId ?? root.id;
    const parent = nodes[parentId] ?? items.find((i) => i.id === parentId);

    nodes[id] = { ...item, children };
    
    if (parent) {
        if (!parent.children) parent.children = [];
        parent.children.push(item);
    }
  }

  return root.children || [];
}



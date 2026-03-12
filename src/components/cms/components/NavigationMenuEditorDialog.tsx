"use client";

import { useEffect, useRef, useState } from "react";
import {
  DragDropProvider,
  useDraggable,
  useDroppable,
} from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { move } from "@dnd-kit/helpers";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ChevronDown, ExternalLink, FileText, X } from "lucide-react";
import { MenuItem, MenuItemType } from "@/types/cms";
import { usePages } from "./usePages";
import { findItem, removeItem } from "./dndTreeUtils";
import { SortableMenuItem } from "./navigation-menu/SortableMenuItem";
import { DraggableSidebarItem } from "./navigation-menu/DraggableSidebarItem";

// ------------------------------------------------------------------
// Types & Props
// ------------------------------------------------------------------

interface NavigationMenuEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  onSave: (items: MenuItem[]) => void;
  settings: {
    maxDepth: number;
    allowExternalLinks: boolean;
    allowIcons: boolean;
    allowTargetBlank: boolean;
    allowCustomClasses: boolean;
  };
}

// ------------------------------------------------------------------
// Helper Components
// ------------------------------------------------------------------

/**
 * A root drop zone that accepts items dragged from the sidebar or
 * reordered within the menu tree. Uses useDroppable from @dnd-kit/react.
 */
function RootDroppableContainer({ children }: { children: React.ReactNode }) {
  const { ref, isDropTarget } = useDroppable({
    id: "root-container",
    // Lower priority so individual sortable items take precedence
    collisionPriority: 0,
    data: { type: "RootContainer" },
  });

  return (
    <div
      ref={ref}
      className={`min-h-[200px] flex flex-wrap gap-2 items-start transition-colors rounded-lg p-2 ${
        isDropTarget ? "bg-muted/50 ring-2 ring-primary/20" : ""
      }`}
    >
      {children}
    </div>
  );
}

// ------------------------------------------------------------------
// Main Component
// ------------------------------------------------------------------

export function NavigationMenuEditorDialog({
  isOpen,
  onClose,
  menuItems: initialMenuItems,
  onSave,
  settings,
}: NavigationMenuEditorDialogProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const { pages, isLoading: isLoadingPages } = usePages();

  // Keep a snapshot to restore on cancel
  const previousMenuItems = useRef(menuItems);

  useEffect(() => {
    if (isOpen) {
      setMenuItems(initialMenuItems);
    }
  }, [isOpen, initialMenuItems]);

  // ----------------------------------------------------------------
  // Tree Operations
  // ----------------------------------------------------------------

  const handleAddItem = (newItem: MenuItem) => {
    setMenuItems((prev) => [...prev, newItem]);
  };

  const handleAddChild = (parentId: string) => {
    const parent = findItem(menuItems, parentId);
    if (!parent) return;

    const currentDepth = getDepth(menuItems, parentId);
    if (currentDepth >= settings.maxDepth - 1) return;

    const newItem: MenuItem = {
      id: crypto.randomUUID(),
      label: "New Link",
      url: "#",
      type: "internal",
      target: "_self",
      visible: true,
      order: parent.children?.length || 0,
    };

    const updateParent = (items: MenuItem[]): MenuItem[] =>
      items.map((item) => {
        if (item.id === parentId) {
          return {
            ...item,
            type: "dropdown",
            children: [...(item.children || []), newItem],
          };
        }
        if (item.children) return { ...item, children: updateParent(item.children) };
        return item;
      });

    setMenuItems(updateParent(menuItems));
    setEditingItemId(newItem.id);
  };

  const handleRemove = (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      setMenuItems((prev) => removeItem(prev, id));
      if (editingItemId === id) setEditingItemId(null);
    }
  };

  const handleUpdate = (id: string, updates: Partial<MenuItem>) => {
    const deepUpdate = (items: MenuItem[]): MenuItem[] =>
      items.map((item) => {
        if (item.id === id) return { ...item, ...updates };
        if (item.children) return { ...item, children: deepUpdate(item.children) };
        return item;
      });
    setMenuItems((prev) => deepUpdate(prev));
  };

  const getDepth = (items: MenuItem[], id: string | null, current = 0): number => {
    if (!id) return -1;
    for (const item of items) {
      if (item.id === id) return current;
      if (item.children) {
        const d = getDepth(item.children, id, current + 1);
        if (d !== -1) return d;
      }
    }
    return -1;
  };

  // ----------------------------------------------------------------
  // Drag & Drop Handlers
  //
  // @dnd-kit/react v0.3 uses:
  //   event.operation.source  — the dragged item (id, data, type, etc.)
  //   event.operation.target  — the drop target (id, data, etc.)
  //   event.canceled          — whether the drag was cancelled
  //
  // The `move` helper from @dnd-kit/helpers handles array reordering
  // when both source and target are in the same flat array.
  //
  // For our nested tree we still need custom logic; `move` is used as a
  // convenience for the flat root-level list when applicable.
  // ----------------------------------------------------------------

  const handleDragStart = () => {
    // Snapshot state so we can roll back on cancel
    previousMenuItems.current = menuItems;
  };

  /**
   * onDragOver fires continuously while dragging.
   * We use it for live-preview of sortable reordering within the tree.
   * Sidebar items (type === "SidebarItem") are previewed on drop only.
   */
  const handleDragOver = (event: any) => {
    const { source, target } = event.operation;
    if (!source || !target) return;

    // Don't live-reorder sidebar items — handle in onDragEnd
    if (source.data?.type === "SidebarItem") return;

    const sourceId = source.id as string;
    const targetId = target.id as string;

    if (sourceId === targetId) return;
    if (targetId === "root-container") return;

    // Live reorder within the flat root array using the move helper.
    // For nested items this is handled in onDragEnd to keep complexity manageable.
    const sourceIndex = menuItems.findIndex((i) => i.id === sourceId);
    const targetIndex = menuItems.findIndex((i) => i.id === targetId);

    if (sourceIndex !== -1 && targetIndex !== -1) {
      // Both are root-level items — use move helper for live preview
      setMenuItems((prev) => move(prev, event));
    }
  };

  const handleDragEnd = (event: any) => {
    const { source, target } = event.operation;

    if (event.canceled) {
      // Restore snapshot on cancel
      setMenuItems(previousMenuItems.current);
      return;
    }

    if (!source || !target) return;

    const sourceId = source.id as string;
    const targetId = target.id as string;
    const isSidebarItem = source.data?.type === "SidebarItem";
    const isNesting = (targetId as string).startsWith("nest-");
    const resolvedTargetId = isNesting ? targetId.replace("nest-", "") : targetId;
    const isRootDrop = targetId === "root-container";

    // ---- Sidebar item drop ----
    if (isSidebarItem) {
      const newItem: MenuItem = {
        ...source.data?.item,
        id: crypto.randomUUID(),
      };

      if (isRootDrop) {
        setMenuItems((prev) => [...prev, newItem]);
        return;
      }

      if (isNesting) {
        const updateParent = (items: MenuItem[]): MenuItem[] =>
          items.map((item) => {
            if (item.id === resolvedTargetId) {
              return {
                ...item,
                type: "dropdown" as MenuItemType,
                children: [...(item.children || []), newItem],
              };
            }
            if (item.children) return { ...item, children: updateParent(item.children) };
            return item;
          });
        setMenuItems(updateParent(menuItems));
        return;
      }

      // Insert as sibling after target
      const insertAsSibling = (items: MenuItem[], parentId: string | null): MenuItem[] | null => {
        for (let i = 0; i < items.length; i++) {
          if (items[i].id === resolvedTargetId) {
            const arr = [...items];
            arr.splice(i + 1, 0, newItem);
            return arr;
          }
          if (items[i].children) {
            const updated = insertAsSibling(items[i].children!, items[i].id);
            if (updated) {
              return items.map((item) =>
                item.id === items[i].id ? { ...item, children: updated } : item
              );
            }
          }
        }
        return null;
      };

      const result = insertAsSibling(menuItems, null);
      if (result) {
        setMenuItems(result);
      } else {
        setMenuItems((prev) => [...prev, newItem]);
      }
      return;
    }

    // ---- Internal tree reorder / nest ----
    if (sourceId === resolvedTargetId && !isRootDrop) return;

    if (isRootDrop) {
      const itemToMove = findItem(menuItems, sourceId);
      if (!itemToMove) return;
      const newTree = removeItem(menuItems, sourceId);
      setMenuItems([...newTree, itemToMove]);
      return;
    }

    if (isNesting) {
      const itemToMove = findItem(menuItems, sourceId);
      if (!itemToMove) return;
      const newTree = removeItem(menuItems, sourceId);

      const updateTarget = (items: MenuItem[]): MenuItem[] =>
        items.map((item) => {
          if (item.id === resolvedTargetId) {
            return {
              ...item,
              type: "dropdown" as MenuItemType,
              children: [...(item.children || []), itemToMove],
            };
          }
          if (item.children) return { ...item, children: updateTarget(item.children) };
          return item;
        });

      setMenuItems(updateTarget(newTree));
      return;
    }

    // Standard reorder: find parent arrays and move
    type ParentInfo = { array: MenuItem[]; index: number; parentId: string | null };

    const findParentArray = (
      items: MenuItem[],
      id: string,
      parentId: string | null = null
    ): ParentInfo | null => {
      for (let i = 0; i < items.length; i++) {
        if (items[i].id === id) return { array: items, index: i, parentId };
        if (items[i].children) {
          const res = findParentArray(items[i].children!, id, items[i].id);
          if (res) return res;
        }
      }
      return null;
    };

    const sourceInfo = findParentArray(menuItems, sourceId);
    const targetInfo = findParentArray(menuItems, targetId);

    if (!sourceInfo || !targetInfo) return;

    const sameParent = sourceInfo.parentId === targetInfo.parentId;

    if (sameParent) {
      // Reorder within the same container
      const updateList = (items: MenuItem[]): MenuItem[] => {
        if (sourceInfo.parentId === null) {
          const arr = [...items];
          const [moved] = arr.splice(sourceInfo.index, 1);
          arr.splice(targetInfo.index, 0, moved);
          return arr;
        }
        return items.map((item) => {
          if (item.id === sourceInfo.parentId && item.children) {
            const arr = [...item.children];
            const [moved] = arr.splice(sourceInfo.index, 1);
            arr.splice(targetInfo.index, 0, moved);
            return { ...item, children: arr };
          }
          if (item.children) return { ...item, children: updateList(item.children) };
          return item;
        });
      };
      setMenuItems(updateList(menuItems));
    } else {
      // Move to different container as sibling
      const itemToMove = findItem(menuItems, sourceId);
      if (!itemToMove) return;
      const newTree = removeItem(menuItems, sourceId);

      const insertAt = (items: MenuItem[]): MenuItem[] => {
        if (targetInfo.parentId === null) {
          const arr = [...items];
          arr.splice(targetInfo.index, 0, itemToMove);
          return arr;
        }
        return items.map((item) => {
          if (item.id === targetInfo.parentId && item.children) {
            const newChildren = [...item.children];
            newChildren.splice(targetInfo.index, 0, itemToMove);
            return { ...item, children: newChildren };
          }
          if (item.children) return { ...item, children: insertAt(item.children) };
          return item;
        });
      };

      setMenuItems(insertAt(newTree));
    }
  };

  // ----------------------------------------------------------------
  // Editor Actions
  // ----------------------------------------------------------------

  const handleSave = () => {
    onSave(menuItems);
    onClose();
  };

  const editingItem = editingItemId ? findItem(menuItems, editingItemId) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Navigation Menu Editor</DialogTitle>
          <DialogDescription>
            Drag and drop items to rearrange. Use the panel on the right to add pages.
          </DialogDescription>
        </DialogHeader>

        {/*
          DragDropProvider replaces DndContext from @dnd-kit/core.
          - No more sensors/useSensors config — sensors are configured via
            the `sensors` prop or per-draggable.
          - onDragOver for live preview, onDragEnd for committed state.
        */}
        <DragDropProvider
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-1 overflow-hidden">
            {/* Left: Menu Tree */}
            <div className="flex-1 flex flex-col min-w-0 border-r bg-accent/10">
              <div className="p-4 border-b bg-background flex justify-between items-center">
                <h3 className="font-medium text-sm flex items-center gap-2">
                  Menu Structure
                  <Badge variant="secondary" className="text-xs">
                    {menuItems.reduce((acc, i) => acc + 1 + (i.children?.length || 0), 0)}+
                  </Badge>
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    handleAddItem({
                      id: crypto.randomUUID(),
                      label: "New Link",
                      url: "",
                      type: "internal",
                      target: "_self",
                      visible: true,
                      order: menuItems.length,
                    })
                  }
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Top Level
                </Button>
              </div>

              <ScrollArea className="flex-1 p-4">
                {/*
                  RootDroppableContainer uses useDroppable from @dnd-kit/react.
                  SortableMenuItem must be updated to use useSortable from
                  @dnd-kit/react/sortable (see notes below).
                */}
                <RootDroppableContainer>
                  {menuItems.map((item, index) => (
                    <SortableMenuItem
                      key={item.id}
                      item={item}
                      index={index}
                      depth={0}
                      onEdit={setEditingItemId}
                      onRemove={handleRemove}
                      onAddChild={handleAddChild}
                      settings={settings}
                    />
                  ))}
                  {menuItems.length === 0 && (
                    <div className="w-full h-32 flex items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground text-sm">
                      Drag pages here to start building your menu
                    </div>
                  )}
                </RootDroppableContainer>
              </ScrollArea>
            </div>

            {/* Right: Sidebar (Editor + Pages) */}
            <div className="w-[350px] flex flex-col bg-background">
              {editingItem ? (
                <div className="flex-1 flex flex-col">
                  <div className="p-4 border-b flex items-center justify-between bg-muted/20">
                    <span className="font-semibold text-sm">Edit Item</span>
                    <Button variant="ghost" size="icon" onClick={() => setEditingItemId(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Label</Label>
                        <Input
                          value={editingItem.label}
                          onChange={(e) => handleUpdate(editingItem.id, { label: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={editingItem.type}
                          onValueChange={(val: MenuItemType) =>
                            handleUpdate(editingItem.id, { type: val })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="internal">Internal Page</SelectItem>
                            <SelectItem value="external">External Link</SelectItem>
                            <SelectItem value="dropdown">Dropdown Group</SelectItem>
                            <SelectItem value="anchor">Anchor/Section</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {editingItem.type === "internal" && (
                        <div className="space-y-2">
                          <Label>Page</Label>
                          <Select
                            value={editingItem.pageId || ""}
                            onValueChange={(val) => {
                              const page = pages.find((p) => p.id === val);
                              if (page) {
                                handleUpdate(editingItem.id, {
                                  pageId: page.id,
                                  url: `/${page.slug}`,
                                  label:
                                    editingItem.label === "New Link"
                                      ? page.name
                                      : editingItem.label,
                                });
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a page..." />
                            </SelectTrigger>
                            <SelectContent>
                              {pages.map((page) => (
                                <SelectItem key={page.id} value={page.id}>
                                  {page.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {(editingItem.type === "external" || editingItem.type === "internal") && (
                        <div className="space-y-2">
                          <Label>URL</Label>
                          <Input
                            value={editingItem.url}
                            onChange={(e) => handleUpdate(editingItem.id, { url: e.target.value })}
                            disabled={editingItem.type === "internal" && !!editingItem.pageId}
                          />
                        </div>
                      )}

                      {settings.allowTargetBlank && (
                        <div className="flex items-center space-x-2 py-2">
                          <Checkbox
                            id="targetBlank"
                            checked={editingItem.target === "_blank"}
                            onCheckedChange={(checked) =>
                              handleUpdate(editingItem.id, {
                                target: checked ? "_blank" : "_self",
                              })
                            }
                          />
                          <Label htmlFor="targetBlank">Open in new tab</Label>
                        </div>
                      )}

                      <div className="flex items-center space-x-2 py-2">
                        <Checkbox
                          id="isVisible"
                          checked={editingItem.visible}
                          onCheckedChange={(checked) =>
                            handleUpdate(editingItem.id, { visible: !!checked })
                          }
                        />
                        <Label htmlFor="isVisible">Visible</Label>
                      </div>

                      {settings.allowCustomClasses && (
                        <div className="space-y-2">
                          <Label>CSS Classes</Label>
                          <Input
                            value={editingItem.cssClasses || ""}
                            onChange={(e) =>
                              handleUpdate(editingItem.id, { cssClasses: e.target.value })
                            }
                            placeholder="e.g. font-bold text-red-500"
                          />
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <Tabs defaultValue="pages" className="flex-1 flex flex-col">
                  <div className="px-4 pt-4">
                    <TabsList className="w-full">
                      <TabsTrigger value="pages" className="flex-1">
                        Pages
                      </TabsTrigger>
                      <TabsTrigger value="custom" className="flex-1">
                        Custom
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="pages" className="flex-1 flex flex-col min-h-0 p-0">
                    <div className="p-4 pb-2">
                      <Input placeholder="Search pages..." />
                    </div>
                    <ScrollArea className="flex-1">
                      <div className="p-4 space-y-2">
                        {isLoadingPages ? (
                          <div className="text-center text-muted-foreground text-sm">
                            Loading pages...
                          </div>
                        ) : (
                          pages.map((page) => (
                            /*
                             * DraggableSidebarItem must be updated to use
                             * useDraggable from @dnd-kit/react (see notes).
                             */
                            <DraggableSidebarItem
                              key={page.id}
                              page={page}
                              type="internal"
                              label={page.name}
                            >
                              <Card className="cursor-grab active:cursor-grabbing hover:bg-accent transition-colors">
                                <CardContent className="p-3 flex items-center gap-3">
                                  <FileText className="w-4 h-4 text-muted-foreground" />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">{page.name}</div>
                                    <div className="text-xs text-muted-foreground truncate">
                                      /{page.slug}
                                    </div>
                                  </div>
                                  <Plus className="w-4 h-4 text-muted-foreground" />
                                </CardContent>
                              </Card>
                            </DraggableSidebarItem>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="custom" className="flex-1 p-4">
                    <div className="grid gap-4">
                      <DraggableSidebarItem page={null} type="external" label="External Link">
                        <Card className="cursor-grab active:cursor-grabbing hover:bg-accent transition-colors">
                          <CardContent className="p-4 flex items-center gap-3">
                            <ExternalLink className="w-4 h-4" />
                            <div className="text-sm font-medium">Add External Link</div>
                          </CardContent>
                        </Card>
                      </DraggableSidebarItem>

                      <DraggableSidebarItem page={null} type="dropdown" label="Dropdown Group">
                        <Card className="cursor-grab active:cursor-grabbing hover:bg-accent transition-colors">
                          <CardContent className="p-4 flex items-center gap-3">
                            <ChevronDown className="w-4 h-4" />
                            <div className="text-sm font-medium">Add Dropdown Group</div>
                          </CardContent>
                        </Card>
                      </DraggableSidebarItem>
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </div>
        </DragDropProvider>

        <DialogFooter className="p-4 border-t bg-background">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Menu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
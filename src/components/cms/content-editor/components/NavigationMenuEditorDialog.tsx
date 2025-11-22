"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverEvent,
  defaultDropAnimationSideEffects,
  DropAnimation,
  MouseSensor,
  TouchSensor,
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
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
import { findItem, removeItem, setProperty } from "./dndTreeUtils";
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

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.5",
      },
    },
  }),
};

function RootDroppableContainer({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: "root-container",
    data: { type: "RootContainer" },
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[200px] flex flex-wrap gap-2 items-start transition-colors rounded-lg p-2 ${
        isOver ? "bg-muted/50 ring-2 ring-primary/20" : ""
      }`}
    >
      {children}
    </div>
  );
}

// ------------------------------------------------------------------
// Main Component
// ------------------------------------------------------------------

export function NavigationMenuEditorDialog({ isOpen, onClose, menuItems: initialMenuItems, onSave, settings }: NavigationMenuEditorDialogProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const { pages, isLoading: isLoadingPages } = usePages();
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
  const [activeSidebarItem, setActiveSidebarItem] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMenuItems(initialMenuItems);
    }
  }, [isOpen, initialMenuItems]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

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

    // Recursively find and update parent
    const updateParent = (items: MenuItem[]): MenuItem[] => {
      return items.map((item) => {
        if (item.id === parentId) {
          return {
            ...item,
            type: item.type === "dropdown" ? "dropdown" : "dropdown",
            children: [...(item.children || []), newItem],
          };
        }
        if (item.children) {
          return { ...item, children: updateParent(item.children) };
        }
        return item;
      });
    };

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
    const deepUpdate = (items: MenuItem[]): MenuItem[] => {
      return items.map((item) => {
        if (item.id === id) return { ...item, ...updates };
        if (item.children) return { ...item, children: deepUpdate(item.children) };
        return item;
      });
    };
    setMenuItems((prev) => deepUpdate(prev));
  };

  // ----------------------------------------------------------------
  // Drag & Drop Handlers
  // ----------------------------------------------------------------

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    if (active.data.current?.type === "SidebarItem") {
      setActiveSidebarItem(active.data.current.item);
      setActiveItem(active.data.current.item); // Use the temp item for preview
    } else {
      const item = findItem(menuItems, active.id as string);
      setActiveItem(item || null);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Optional: Real-time preview or placeholder logic
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveItem(null);
    setActiveSidebarItem(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const isSidebarItem = active.data.current?.type === "SidebarItem";
    const isNesting = overId.startsWith("nest-");
    const targetId = isNesting ? overId.replace("nest-", "") : overId;
    const isRootDrop = overId === "root-container";

    // --- Handle Sidebar Drop ---
    if (isSidebarItem) {
      const newItem = {
        ...active.data.current?.item,
        id: crypto.randomUUID(), // Generate real ID on drop
      };

      if (isRootDrop) {
         setMenuItems([...menuItems, newItem]);
         return;
      }

      if (isNesting) {
        // Add as child of targetId
        const parent = findItem(menuItems, targetId);
        if (parent) {
          const updateParent = (items: MenuItem[]): MenuItem[] => {
            return items.map((item) => {
              if (item.id === targetId) {
                return {
                  ...item,
                  type: item.type === "dropdown" ? "dropdown" : "dropdown",
                  children: [...(item.children || []), newItem],
                };
              }
              if (item.children) {
                return { ...item, children: updateParent(item.children) };
              }
              return item;
            });
          };
          setMenuItems(updateParent(menuItems));
        }
      } else {
        // Add as sibling or root
        // Find parent of target
        const findParentArray = (items: MenuItem[], id: string): { array: MenuItem[]; index: number; parent: MenuItem | null } | null => {
          for (let i = 0; i < items.length; i++) {
            if (items[i].id === id) return { array: items, index: i, parent: null };
            if (items[i].children) {
              const res = findParentArray(items[i].children!, id);
              if (res) return { array: res.array, index: res.index, parent: items[i] };
            }
          }
          return null;
        };

        const overInfo = findParentArray(menuItems, targetId);
        if (overInfo) {
          const insertIntoArray = (items: MenuItem[], parentId: string | null, index: number, item: MenuItem): MenuItem[] => {
            if (parentId === null) {
              const newRoot = [...items];
              newRoot.splice(index + 1, 0, item); // Default: insert after
              return newRoot;
            }
            return items.map((node) => {
              if (node.id === parentId) {
                const newChildren = [...(node.children || [])];
                newChildren.splice(index + 1, 0, item);
                return { ...node, children: newChildren };
              }
              if (node.children) {
                return { ...node, children: insertIntoArray(node.children, parentId, index, item) };
              }
              return node;
            });
          };
          setMenuItems(insertIntoArray(menuItems, overInfo.parent?.id || null, overInfo.index, newItem));
        } else {
          // Fallback: add to root
          setMenuItems([...menuItems, newItem]);
        }
      }
      return;
    }

    // --- Handle Internal Sort/Nest ---
    if (activeId === targetId && !isRootDrop) return;

    if (isRootDrop) {
        // Move active item to root if it isn't already there? 
        // Or if dropped on empty space, append to root.
        // Remove from old location
        let newTree = removeItem(menuItems, activeId);
        const itemToMove = findItem(menuItems, activeId);
        if (!itemToMove) return;
        
        // Add to root end
        setMenuItems([...newTree, itemToMove]);
        return;
    }

    if (isNesting) {
      // Move activeId to children of targetId
      let newTree = removeItem(menuItems, activeId);
      const itemToMove = findItem(menuItems, activeId);
      if (!itemToMove) return;

      const updateTarget = (items: MenuItem[]): MenuItem[] => {
        return items.map(item => {
          if (item.id === targetId) {
            return {
              ...item,
              type: "dropdown",
              children: [...(item.children || []), itemToMove]
            };
          }
          if (item.children) return { ...item, children: updateTarget(item.children) };
          return item;
        });
      };
      setMenuItems(updateTarget(newTree));
    } else {
      // Reorder (Sort)
      const findParentArray = (items: MenuItem[], id: string): { array: MenuItem[]; index: number; parent: MenuItem | null } | null => {
        for (let i = 0; i < items.length; i++) {
          if (items[i].id === id) return { array: items, index: i, parent: null };
          if (items[i].children) {
            const res = findParentArray(items[i].children!, id);
            if (res) return { array: res.array, index: res.index, parent: items[i] };
          }
        }
        return null;
      };
  
      const activeInfo = findParentArray(menuItems, activeId);
      const overInfo = findParentArray(menuItems, overId);
  
      if (!activeInfo || !overInfo) return;
  
      // Reordering within same container
      if (activeInfo.array === overInfo.array || (activeInfo.parent?.id === overInfo.parent?.id)) {
        const oldIndex = activeInfo.index;
        const newIndex = overInfo.index;
        const parentId = activeInfo.parent?.id || null;
        
        const updateChildren = (items: MenuItem[]): MenuItem[] => {
          if (parentId === null) {
            return arrayMove(items, oldIndex, newIndex);
          }
          return items.map(item => {
            if (item.id === parentId && item.children) {
              return { ...item, children: arrayMove(item.children, oldIndex, newIndex) };
            }
            if (item.children) {
              return { ...item, children: updateChildren(item.children) };
            }
            return item;
          });
        };
        
        setMenuItems(updateChildren(menuItems));
      } else {
        // Moving to different container (as sibling)
        let newTree = removeItem(menuItems, activeId);
        const itemToMove = findItem(menuItems, activeId);
        if (!itemToMove) return;

        const parentId = overInfo.parent?.id || null;
        const insertAt = (items: MenuItem[]): MenuItem[] => {
          if (parentId === null) {
            const arr = [...items];
            arr.splice(overInfo.index, 0, itemToMove);
            return arr;
          }
          return items.map(item => {
            if (item.id === parentId && item.children) {
              const newChildren = [...item.children];
              newChildren.splice(overInfo.index, 0, itemToMove);
              return { ...item, children: newChildren };
            }
            if (item.children) return { ...item, children: insertAt(item.children) };
            return item;
          });
        };
        setMenuItems(insertAt(newTree));
      }
    }
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
          <DialogDescription>Drag and drop items to rearrange. Use the panel on the right to add pages.</DialogDescription>
        </DialogHeader>

        {/* Wrap EVERYTHING in DndContext to allow dragging from sidebar to tree */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
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
                <RootDroppableContainer>
                  <SortableContext items={menuItems.map((i) => i.id)} strategy={horizontalListSortingStrategy}>
                      {menuItems.map((item) => (
                        <SortableMenuItem
                          key={item.id}
                          item={item}
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
                  </SortableContext>
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
                        <Input value={editingItem.label} onChange={(e) => handleUpdate(editingItem.id, { label: e.target.value })} />
                      </div>

                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={editingItem.type} onValueChange={(val: MenuItemType) => handleUpdate(editingItem.id, { type: val })}>
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
                                  label: editingItem.label === "New Link" ? page.name : editingItem.label,
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
                            onCheckedChange={(checked) => handleUpdate(editingItem.id, { target: checked ? "_blank" : "_self" })}
                          />
                          <Label htmlFor="targetBlank">Open in new tab</Label>
                        </div>
                      )}

                      <div className="flex items-center space-x-2 py-2">
                        <Checkbox
                          id="isVisible"
                          checked={editingItem.visible}
                          onCheckedChange={(checked) => handleUpdate(editingItem.id, { visible: !!checked })}
                        />
                        <Label htmlFor="isVisible">Visible</Label>
                      </div>

                      {settings.allowCustomClasses && (
                        <div className="space-y-2">
                          <Label>CSS Classes</Label>
                          <Input
                            value={editingItem.cssClasses || ""}
                            onChange={(e) => handleUpdate(editingItem.id, { cssClasses: e.target.value })}
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
                          <div className="text-center text-muted-foreground text-sm">Loading pages...</div>
                        ) : (
                          pages.map((page) => (
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
                                    <div className="text-xs text-muted-foreground truncate">/{page.slug}</div>
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
                      <DraggableSidebarItem
                        page={null}
                        type="external"
                        label="External Link"
                      >
                        <Card className="cursor-grab active:cursor-grabbing hover:bg-accent transition-colors">
                          <CardContent className="p-4 flex items-center gap-3">
                            <ExternalLink className="w-4 h-4" />
                            <div className="text-sm font-medium">Add External Link</div>
                          </CardContent>
                        </Card>
                      </DraggableSidebarItem>

                      <DraggableSidebarItem
                        page={null}
                        type="dropdown"
                        label="Dropdown Group"
                      >
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

          <DragOverlay dropAnimation={dropAnimation}>
            {activeItem ? (
              <div className="w-48 opacity-80">
                <div className="flex items-center gap-2 rounded-md border bg-card p-2 shadow-sm ring-2 ring-primary">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium truncate block">{activeItem.label || "Untitled"}</span>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

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

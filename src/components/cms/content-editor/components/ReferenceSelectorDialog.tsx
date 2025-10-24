"use client";

import { useState, useEffect, Fragment } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCollectionEntries, getCollectionEntryById, createCollectionEntry, CollectionEntry, CollectionEntryWithItems } from "@/actions/cms/collection-entry-actions";
import { ChevronDown, ChevronRight, Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface ReferenceSelectorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  collectionId: string;
  currentValue: { all?: boolean; entry_ids?: string[] } | null;
  onConfirm: (value: { all?: boolean; entry_ids?: string[] }) => void;
}

export function ReferenceSelectorDialog({
  isOpen,
  onClose,
  collectionId,
  currentValue,
  onConfirm,
}: ReferenceSelectorDialogProps) {
  const [entries, setEntries] = useState<CollectionEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [entryDetails, setEntryDetails] = useState<Map<string, CollectionEntryWithItems>>(new Map());
  const [loadingDetails, setLoadingDetails] = useState<Set<string>>(new Set());
  
  // Selection state
  const [selectAll, setSelectAll] = useState(currentValue?.all || false);
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(
    new Set(currentValue?.entry_ids || [])
  );

  // Quick create state
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEntryName, setNewEntryName] = useState("");

  // Load entries
  useEffect(() => {
    if (isOpen && collectionId) {
      loadEntries();
    }
  }, [isOpen, collectionId]);

  const loadEntries = async () => {
    setIsLoading(true);
    try {
      const result = await getCollectionEntries(collectionId);
      if (result.success && result.data) {
        setEntries(result.data);
      } else {
        toast.error(result.error || "Failed to load entries");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRowExpansion = async (entryId: string) => {
    const newExpanded = new Set(expandedRows);
    if (expandedRows.has(entryId)) {
      newExpanded.delete(entryId);
      setExpandedRows(newExpanded);
    } else {
      newExpanded.add(entryId);
      setExpandedRows(newExpanded);

      // Load entry details if not already loaded
      if (!entryDetails.has(entryId)) {
        setLoadingDetails(new Set(loadingDetails).add(entryId));
        try {
          const result = await getCollectionEntryById(entryId);
          if (result.success && result.data) {
            const newDetails = new Map(entryDetails);
            newDetails.set(entryId, result.data);
            setEntryDetails(newDetails);
          }
        } catch (error) {
          console.error("Error loading entry details:", error);
        } finally {
          const newLoading = new Set(loadingDetails);
          newLoading.delete(entryId);
          setLoadingDetails(newLoading);
        }
      }
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      // Clear individual selections when "Select All" is enabled
      setSelectedEntryIds(new Set());
    }
  };

  const handleSelectEntry = (entryId: string, checked: boolean) => {
    const newSelected = new Set(selectedEntryIds);
    if (checked) {
      newSelected.add(entryId);
    } else {
      newSelected.delete(entryId);
    }
    setSelectedEntryIds(newSelected);
    
    // If selecting individual entries, disable "Select All"
    if (checked && selectAll) {
      setSelectAll(false);
    }
  };

  const handleCreateEntry = async () => {
    if (!newEntryName.trim()) {
      toast.error("Please enter an entry name");
      return;
    }

    setIsCreating(true);
    try {
      const result = await createCollectionEntry({
        collection_id: collectionId,
        name: newEntryName,
      });

      if (result.success && result.data) {
        toast.success("Entry created successfully");
        setEntries((prev) => [result.data!, ...prev]);
        setNewEntryName("");
        setShowCreateForm(false);
        
        // Automatically select the newly created entry
        const newSelected = new Set(selectedEntryIds);
        newSelected.add(result.data.id);
        setSelectedEntryIds(newSelected);
        setSelectAll(false);
      } else {
        toast.error(result.error || "Failed to create entry");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirm = () => {
    if (selectAll) {
      onConfirm({ all: true });
    } else {
      onConfirm({ entry_ids: Array.from(selectedEntryIds) });
    }
    onClose();
  };

  const handleCancel = () => {
    // Reset to current value
    setSelectAll(currentValue?.all || false);
    setSelectedEntryIds(new Set(currentValue?.entry_ids || []));
    setShowCreateForm(false);
    setNewEntryName("");
    onClose();
  };

  // Filter entries based on search
  const filteredEntries = entries.filter((entry) =>
    entry.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Entries</DialogTitle>
          <DialogDescription>
            Choose which entries to reference in your content
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Actions Bar */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              <Plus className="h-4 w-4 mr-1" />
              New Entry
            </Button>
          </div>

          {/* Quick Create Form */}
          {showCreateForm && (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
              <Label htmlFor="new-entry-name">Entry Name</Label>
              <div className="flex gap-2">
                <Input
                  id="new-entry-name"
                  placeholder="Enter entry name..."
                  value={newEntryName}
                  onChange={(e) => setNewEntryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isCreating) {
                      handleCreateEntry();
                    }
                  }}
                  disabled={isCreating}
                />
                <Button
                  onClick={handleCreateEntry}
                  disabled={isCreating || !newEntryName.trim()}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create"
                  )}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewEntryName("");
                  }}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Entries Table */}
          <div className="border rounded-lg flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading entries...</span>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <p className="text-muted-foreground">
                  {searchQuery ? "No entries match your search" : "No entries available"}
                </p>
                {!searchQuery && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setShowCreateForm(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Create First Entry
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all entries"
                      />
                    </TableHead>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Entry Name</TableHead>
                    <TableHead className="w-48">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => {
                    const isExpanded = expandedRows.has(entry.id);
                    const isSelected = selectAll || selectedEntryIds.has(entry.id);
                    const details = entryDetails.get(entry.id);
                    const isLoadingDetail = loadingDetails.has(entry.id);

                    return (
                      <Fragment key={entry.id}>
                        <TableRow className={isSelected ? "bg-muted/50" : ""}>
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) =>
                                handleSelectEntry(entry.id, checked as boolean)
                              }
                              disabled={selectAll}
                              aria-label={`Select ${entry.name}`}
                            />
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="p-0 h-6 w-6"
                              onClick={() => toggleRowExpansion(entry.id)}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-medium">
                            {entry.name || "Untitled Entry"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(entry.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={4} className="bg-muted/30 p-4">
                              {isLoadingDetail ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Loading details...
                                </div>
                              ) : details && details.cms_collections_items ? (
                                <div className="space-y-2">
                                  <p className="text-sm font-medium mb-3">Entry Fields:</p>
                                  {details.cms_collections_items.length === 0 ? (
                                    <p className="text-sm text-muted-foreground italic">
                                      No fields configured
                                    </p>
                                  ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                      {details.cms_collections_items.map((item) => (
                                        <div
                                          key={item.id}
                                          className="text-sm border rounded p-2 bg-background"
                                        >
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium">{item.name}:</span>
                                            <Badge variant="secondary" className="text-xs">
                                              {item.field_type}
                                            </Badge>
                                          </div>
                                          <p className="text-muted-foreground truncate">
                                            {item.content
                                              ? typeof item.content === "object"
                                                ? JSON.stringify(item.content)
                                                : item.content
                                              : "No value"}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  No details available
                                </p>
                              )}
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Selection Summary */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {selectAll ? (
              <Badge variant="secondary">All entries selected</Badge>
            ) : selectedEntryIds.size > 0 ? (
              <Badge variant="secondary">
                {selectedEntryIds.size} {selectedEntryIds.size === 1 ? "entry" : "entries"} selected
              </Badge>
            ) : (
              <span>No entries selected</span>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectAll && selectedEntryIds.size === 0}>
            Confirm Selection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


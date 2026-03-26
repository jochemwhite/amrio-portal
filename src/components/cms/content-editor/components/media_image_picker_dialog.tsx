"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  AlertTriangle,
  ChevronRight,
  FolderOpen,
  Image as ImageIcon,
  Loader2,
  Search,
  Upload,
} from "lucide-react"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/supabaseClient"
import { getPublicUrl } from "@/lib/r2/urls"
import { cn } from "@/lib/utils"
import { useMediaUpload } from "@/hooks/useMediaUpload"
import { useUserSession } from "@/providers/session-provider"
import { StorageFolder } from "@/components/storage/types"
import { formatBytes } from "@/components/storage/utils"
import { Tree, type TreeViewElement } from "@/components/ui/file-tree"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type StorageImage = {
  id: string
  folder_id: string | null
  original_filename: string
  storage_path: string
  size_bytes: number
  width: number | null
  height: number | null
  mime_type: string
  alt_text?: string | null
}

export type SelectedMediaImage = {
  id: string
  name: string
  url: string
  size: number
  width?: number
  height?: number
  altText?: string
}

type MediaImagePickerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (image: SelectedMediaImage) => void
  title?: string
  description?: string
}

export function MediaImagePickerDialog({
  open,
  onOpenChange,
  onSelect,
  title = "Select Image",
  description = "Choose from your storage or upload a new image",
}: MediaImagePickerDialogProps) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [storageImages, setStorageImages] = useState<StorageImage[]>([])
  const [storageFolders, setStorageFolders] = useState<StorageFolder[]>([])
  const [isLoadingImages, setIsLoadingImages] = useState(false)
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const { userSession } = useUserSession()
  const { uploadFile: uploadMediaFile, progress, error: uploadError, reset } = useMediaUpload()

  const activeTenantId = userSession?.active_tenant?.id
  const activeWebsiteId = userSession?.active_website?.id
  const isUploading = progress === "uploading" || progress === "confirming"
  const rootTreeId = "__root__"

  const folderTreeElements = useMemo<TreeViewElement[]>(() => {
    const byParent = new Map<string | null, StorageFolder[]>()

    for (const folder of storageFolders) {
      const siblings = byParent.get(folder.parent_folder_id) ?? []
      siblings.push(folder)
      byParent.set(folder.parent_folder_id, siblings)
    }

    const buildChildren = (parentId: string | null): TreeViewElement[] => {
      const folders = byParent.get(parentId) ?? []

      return folders
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((folder) => ({
          id: folder.id,
          name: folder.name,
          type: "folder",
          children: buildChildren(folder.id),
        }))
    }

    return [
      {
        id: rootTreeId,
        name: "Root",
        type: "folder",
        children: buildChildren(null),
      },
    ]
  }, [storageFolders])

  const filteredImages = storageImages.filter((image) => {
    const matchesFolder =
      selectedFolderId === null ? image.folder_id === null : image.folder_id === selectedFolderId
    const matchesSearch =
      search.trim().length === 0 ||
      image.original_filename.toLowerCase().includes(search.trim().toLowerCase())

    return matchesFolder && matchesSearch
  })

  const fetch_storage_images = useCallback(async () => {
    if (!activeTenantId || !activeWebsiteId) {
      return
    }

    setIsLoadingImages(true)

    try {
      const [{ data: filesData, error: filesError }, { data: foldersData, error: foldersError }] =
        await Promise.all([
          supabase
            .from("files")
            .select("*")
            .eq("tenant_id", activeTenantId)
            .eq("website_id", activeWebsiteId)
            .eq("file_type", "image")
            .is("deleted_at", null)
            .eq("upload_status", "confirmed")
            .order("created_at", { ascending: false }),
          supabase
            .from("folders")
            .select("*")
            .eq("tenant_id", activeTenantId)
            .eq("website_id", activeWebsiteId)
            .is("deleted_at", null)
            .order("full_path", { ascending: true }),
        ])

      if (filesError) {
        throw filesError
      }

      if (foldersError) {
        throw foldersError
      }

      const nextFiles = filesData ?? []
      setStorageImages(nextFiles)
      setStorageFolders(foldersData ?? [])

      const nextUrls: Record<string, string> = {}
      for (const image of nextFiles) {
        nextUrls[image.id] = getPublicUrl(image.storage_path)
      }
      setImageUrls(nextUrls)
    } catch (error) {
      console.error("Error fetching images:", error)
      toast.error("Failed to load images")
    } finally {
      setIsLoadingImages(false)
    }
  }, [activeTenantId, activeWebsiteId, supabase])

  async function upload_file(file: File) {
    if (!activeTenantId || !activeWebsiteId) {
      toast.error("No active tenant or website selected")
      return null
    }

    try {
      reset()
      const uploadedFile = await uploadMediaFile(file, activeTenantId, activeWebsiteId)
      await fetch_storage_images()

      const selectedImage: SelectedMediaImage = {
        id: uploadedFile.id,
        name: uploadedFile.original_filename,
        url: getPublicUrl(uploadedFile.storage_path),
        size: uploadedFile.size_bytes,
        width: uploadedFile.width ?? undefined,
        height: uploadedFile.height ?? undefined,
      }

      toast.success(`${file.name} uploaded successfully`)
      onSelect(selectedImage)
      onOpenChange(false)
      return selectedImage
    } catch (error) {
      console.error("Upload error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to upload image")
      return null
    }
  }

  function select_existing_image(image: StorageImage) {
    onSelect({
      id: image.id,
      name: image.original_filename,
      url: imageUrls[image.id],
      size: image.size_bytes,
      width: image.width ?? undefined,
      height: image.height ?? undefined,
      altText: image.alt_text || image.original_filename,
    })
    onOpenChange(false)
  }

  async function handle_file_select(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    await upload_file(file)
    event.target.value = ""
  }

  useEffect(() => {
    if (!open) {
      return
    }

    setSelectedFolderId(null)
    setSearch("")
    void fetch_storage_images()
  }, [fetch_storage_images, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-[96vw] max-w-6xl sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="storage" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="storage">From Storage</TabsTrigger>
            <TabsTrigger value="upload">Upload New</TabsTrigger>
          </TabsList>

          <TabsContent value="storage" className="mt-4">
            <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
              <div className="overflow-hidden rounded-xl border bg-muted/10">
                <div className="border-b px-3 py-2">
                  <p className="text-sm font-medium">Folders</p>
                </div>
                <Tree
                  className="h-48 lg:h-[460px]"
                  elements={folderTreeElements}
                  initialExpandedItems={[rootTreeId]}
                  initialSelectedId={selectedFolderId ?? rootTreeId}
                  onSelectChange={(id) => setSelectedFolderId(id === rootTreeId ? null : id)}
                />
              </div>

              <div className="min-w-0 overflow-hidden rounded-xl border bg-muted/10">
                <div className="border-b p-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <FolderOpen className="h-3.5 w-3.5" />
                          {selectedFolderId === null
                            ? "Root"
                            : storageFolders.find((folder) => folder.id === selectedFolderId)
                                ?.full_path ?? "Folder"}
                        </span>
                        <ChevronRight className="h-3 w-3 shrink-0" />
                        <span>
                          {filteredImages.length} image{filteredImages.length === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>

                    <div className="relative w-full lg:max-w-xs">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search images by filename"
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>

                <ScrollArea className="h-[460px]">
                  {isLoadingImages ? (
                    <div className="flex h-40 items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredImages.length === 0 ? (
                    <div className="flex h-56 flex-col items-center justify-center px-6 text-center">
                      <ImageIcon className="mb-2 h-12 w-12 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        {search ? "No images match your search" : "No images in this folder"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {search
                          ? "Try a different filename or switch folders"
                          : "Upload a new image or choose another folder"}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 xl:grid-cols-4">
                      {filteredImages.map((image) => {
                        const isLarge = image.size_bytes > 500 * 1024

                        return (
                          <button
                            key={image.id}
                            type="button"
                            onClick={() => select_existing_image(image)}
                            className="group relative aspect-square overflow-hidden rounded-lg border-2 border-muted transition-colors hover:border-primary"
                          >
                            <img
                              src={imageUrls[image.id]}
                              alt={image.original_filename}
                              className="h-full w-full object-cover"
                            />

                            {isLarge ? (
                              <div className="absolute top-2 right-2 flex items-center gap-1 rounded bg-amber-500 px-2 py-1 text-xs font-medium text-white">
                                <AlertTriangle className="h-3 w-3" />
                                {formatBytes(image.size_bytes)}
                              </div>
                            ) : null}

                            <div className="absolute inset-x-0 bottom-0 bg-black/70 p-2 text-left text-white opacity-0 transition-opacity group-hover:opacity-100">
                              <p className="truncate text-xs font-medium">
                                {image.original_filename}
                              </p>
                              <p className="mt-1 text-[11px] text-white/80">
                                {formatBytes(image.size_bytes)}
                                {image.width && image.height
                                  ? ` • ${image.width}×${image.height}`
                                  : ""}
                              </p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-4">
            <div
              className={cn(
                "rounded-lg border-2 border-dashed border-muted-foreground/25 p-12"
              )}
            >
              <div className="text-center">
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Uploading...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      Click to upload an image
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      PNG, JPG, GIF, WebP up to 100MB
                    </p>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handle_file_select}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-4"
                    >
                      Choose File
                    </Button>
                  </>
                )}

                {uploadError ? (
                  <p className="mt-4 text-sm text-destructive">{uploadError}</p>
                ) : null}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

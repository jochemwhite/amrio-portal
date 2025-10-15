// Core data types for the Storage Manager

export interface StorageFile {
  id: string
  name: string
  url: string
  size: number
  mimeType: string
  createdAt: Date | string
  updatedAt?: Date | string
  altText?: string
  metadata?: Record<string, any>
}

export interface UploadProgress {
  fileName: string
  progress: number
  status: 'pending' | 'uploading' | 'complete' | 'error'
  error?: string
}

// Component props types

export interface StorageInfo {
  used_bytes: number
  quota_bytes: number
  used_mb: string
  quota_mb: string
  percentage: string
}

export interface FileManagerProps {
  files: StorageFile[]
  isLoading?: boolean
  onUpload: (files: File[]) => void
  onDelete: (fileId: string) => void
  onRename: (fileId: string, newName: string, altText?: string) => void
  onDownload: (file: StorageFile) => void
  onSearch?: (query: string) => void
  uploadProgress?: UploadProgress[]
  storageInfo?: StorageInfo
  // Pagination
  currentPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  hasMore?: boolean
  onLoadMore?: () => void
}

export interface UploadDropzoneProps {
  onUpload: (files: File[]) => void
  accept?: string
  maxSize?: number // in bytes
  maxFiles?: number
  uploadProgress?: UploadProgress[]
  disabled?: boolean
}

export interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  placeholder?: string
  disabled?: boolean
}

export interface FileTableProps {
  files: StorageFile[]
  onDelete: (fileId: string) => void
  onRename: (fileId: string) => void
  onDownload: (file: StorageFile) => void
  isLoading?: boolean
}

export interface FileRowProps {
  file: StorageFile
  onDelete: (fileId: string) => void
  onRename: (fileId: string) => void
  onDownload: (file: StorageFile) => void
}

export interface RenameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: StorageFile | null
  onConfirm: (fileId: string, newName: string, altText?: string) => void
}

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  variant?: 'default' | 'destructive'
}

export interface PaginationProps {
  mode: 'pages' | 'loadmore'
  // For pages mode
  currentPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  // For load-more mode
  hasMore?: boolean
  onLoadMore?: () => void
  isLoading?: boolean
}


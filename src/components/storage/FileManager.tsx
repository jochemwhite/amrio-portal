'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { UploadDropzone } from './UploadDropzone'
import { SearchBar } from './SearchBar'
import { FileTable } from './FileTable'
import { RenameDialog } from './RenameDialog'
import { ConfirmDialog } from './ConfirmDialog'
import { Pagination } from './Pagination'
import { HardDrive } from 'lucide-react'
import type { FileManagerProps, StorageFile } from './types'

export const FileManager: React.FC<FileManagerProps> = ({
  files,
  isLoading = false,
  onUpload,
  onDelete,
  onRename,
  onDownload,
  onSearch,
  uploadProgress = [],
  storageInfo,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  hasMore = false,
  onLoadMore,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [renameFile, setRenameFile] = useState<StorageFile | null>(null)
  const [deleteFileId, setDeleteFileId] = useState<string | null>(null)

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    onSearch?.(value)
  }

  const handleSearchClear = () => {
    setSearchQuery('')
    onSearch?.('')
  }

  const handleRenameClick = (fileId: string) => {
    const file = files.find(f => f.id === fileId)
    if (file) {
      setRenameFile(file)
    }
  }

  const handleRenameConfirm = (fileId: string, newName: string, altText?: string) => {
    onRename(fileId, newName, altText)
    setRenameFile(null)
  }

  const handleDeleteClick = (fileId: string) => {
    setDeleteFileId(fileId)
  }

  const handleDeleteConfirm = () => {
    if (deleteFileId) {
      onDelete(deleteFileId)
      setDeleteFileId(null)
    }
  }

  const deleteFileName = files.find(f => f.id === deleteFileId)?.name || ''

  // Determine pagination mode based on props
  const paginationMode = onLoadMore && hasMore !== undefined ? 'loadmore' : 'pages'

  return (
    <div className="space-y-6">
      {/* Storage Usage Section */}
      {storageInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Storage Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {storageInfo.used_mb} MB of {storageInfo.quota_mb} MB used
                </span>
                <span className="font-medium">{storageInfo.percentage}%</span>
              </div>
              <Progress 
                value={parseFloat(storageInfo.percentage)} 
                className="h-2"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {(parseFloat(storageInfo.quota_mb) - parseFloat(storageInfo.used_mb)).toFixed(2)} MB remaining
            </p>
          </CardContent>
        </Card>
      )}

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
        </CardHeader>
        <CardContent>
          <UploadDropzone
            onUpload={onUpload}
            uploadProgress={uploadProgress}
          />
        </CardContent>
      </Card>

      {/* Files Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Files</CardTitle>
            {onSearch && (
              <SearchBar
                value={searchQuery}
                onChange={handleSearchChange}
                onClear={handleSearchClear}
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <FileTable
            files={files}
            onDelete={handleDeleteClick}
            onRename={handleRenameClick}
            onDownload={onDownload}
            isLoading={isLoading}
          />

          {/* Pagination */}
          {!isLoading && files.length > 0 && (
            <Pagination
              mode={paginationMode}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              hasMore={hasMore}
              onLoadMore={onLoadMore}
              isLoading={isLoading}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <RenameDialog
        open={renameFile !== null}
        onOpenChange={(open) => !open && setRenameFile(null)}
        file={renameFile}
        onConfirm={handleRenameConfirm}
      />

      <ConfirmDialog
        open={deleteFileId !== null}
        onOpenChange={(open) => !open && setDeleteFileId(null)}
        title="Delete File"
        description={`Are you sure you want to delete "${deleteFileName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}



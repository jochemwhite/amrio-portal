'use client'

import React from 'react'
import { FileRow } from './FileRow'
import type { FileTableProps } from './types'

export const FileTable: React.FC<FileTableProps> = ({
  files,
  onDelete,
  onRename,
  onDownload,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-lg border bg-card animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center border rounded-lg bg-card">
        <div className="rounded-full bg-muted p-4 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-8 h-8 text-muted-foreground"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2">No files found</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Upload files using the dropzone above or try adjusting your search criteria.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2" role="list" aria-label="File list">
      {files.map((file) => (
        <FileRow
          key={file.id}
          file={file}
          onDelete={onDelete}
          onRename={onRename}
          onDownload={onDownload}
        />
      ))}
    </div>
  )
}






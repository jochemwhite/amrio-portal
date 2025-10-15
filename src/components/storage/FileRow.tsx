'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DownloadIcon, TrashIcon, EditIcon, FileImageIcon } from './icons'
import type { FileRowProps } from './types'

export const FileRow: React.FC<FileRowProps> = ({
  file,
  onDelete,
  onRename,
  onDownload,
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  }

  const isImage = file.mimeType.startsWith('image/')

  return (
    <div className="group flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      {/* Thumbnail */}
      <div className="flex-shrink-0">
        {isImage ? (
          <Avatar className="h-12 w-12 rounded-md">
            <AvatarImage src={file.url} alt={file.altText || file.name} className="object-cover" />
            <AvatarFallback className="rounded-md">
              <FileImageIcon className="w-6 h-6 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
            <FileImageIcon className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* File Info - Desktop */}
      <div className="hidden md:flex flex-1 items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{file.name}</p>
          {file.altText && (
            <p className="text-sm text-muted-foreground truncate">{file.altText}</p>
          )}
        </div>

        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <span className="hidden lg:inline">{formatDate(file.createdAt)}</span>
          <span>{formatFileSize(file.size)}</span>
          <Badge variant="outline" className="hidden xl:inline-flex">
            {file.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
          </Badge>
        </div>
      </div>

      {/* File Info - Mobile */}
      <div className="md:hidden flex-1 min-w-0">
        <p className="font-medium truncate">{file.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
          <Badge variant="outline" className="text-xs">
            {file.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
          </Badge>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDownload(file)}
                className="h-8 w-8"
                aria-label={`Download ${file.name}`}
              >
                <DownloadIcon className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRename(file.id)}
                className="h-8 w-8"
                aria-label={`Rename ${file.name}`}
              >
                <EditIcon className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Rename</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(file.id)}
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                aria-label={`Delete ${file.name}`}
              >
                <TrashIcon className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}






'use client'

import React, { useCallback, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { UploadIcon, XIcon } from './icons'
import type { UploadDropzoneProps } from './types'

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  onUpload,
  accept = 'image/*',
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 10,
  uploadProgress = [],
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const validateFiles = (files: File[]): { valid: File[]; error: string | null } => {
    if (files.length === 0) {
      return { valid: [], error: null }
    }

    if (files.length > maxFiles) {
      return { valid: [], error: `Maximum ${maxFiles} files allowed` }
    }

    const oversizedFiles = files.filter(file => file.size > maxSize)
    if (oversizedFiles.length > 0) {
      return {
        valid: [],
        error: `File size must be less than ${formatFileSize(maxSize)}`,
      }
    }

    return { valid: files, error: null }
  }

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return

      const fileArray = Array.from(files)
      const { valid, error } = validateFiles(fileArray)

      if (error) {
        setError(error)
        setTimeout(() => setError(null), 5000)
        return
      }

      setError(null)
      onUpload(valid)
    },
    [onUpload, maxSize, maxFiles]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (disabled) return

      const files = e.dataTransfer.files
      handleFiles(files)
    },
    [disabled, handleFiles]
  )

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const hasActiveUploads = uploadProgress.length > 0

  return (
    <div className="space-y-4">
      <Card
        className={`
          relative border-2 border-dashed transition-all cursor-pointer
          ${isDragging
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${error ? 'border-destructive' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <div className="p-8 text-center">
          <div className="mx-auto w-12 h-12 mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <UploadIcon className="w-6 h-6 text-primary" />
          </div>

          <h3 className="text-lg font-semibold mb-2">
            {isDragging ? 'Drop files here' : 'Upload files'}
          </h3>

          <p className="text-sm text-muted-foreground mb-4">
            Drag and drop files here, or click to browse
          </p>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation()
              handleClick()
            }}
          >
            Select Files
          </Button>

          <p className="text-xs text-muted-foreground mt-4">
            Max {maxFiles} files, up to {formatFileSize(maxSize)} each
          </p>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={accept}
            onChange={handleChange}
            className="hidden"
            disabled={disabled}
            aria-label="File upload input"
          />
        </div>
      </Card>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          <span className="flex-1">{error}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={() => setError(null)}
          >
            <XIcon className="w-4 h-4" />
          </Button>
        </div>
      )}

      {hasActiveUploads && (
        <Card className="p-4">
          <h4 className="text-sm font-semibold mb-3">Uploading Files</h4>
          <div className="space-y-3">
            {uploadProgress.map((upload, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1 mr-4">{upload.fileName}</span>
                  <span className="text-muted-foreground">
                    {upload.status === 'error' ? (
                      <span className="text-destructive">Failed</span>
                    ) : upload.status === 'complete' ? (
                      <span className="text-green-600">Complete</span>
                    ) : (
                      `${upload.progress}%`
                    )}
                  </span>
                </div>
                {upload.status !== 'complete' && upload.status !== 'error' && (
                  <Progress value={upload.progress} className="h-2" />
                )}
                {upload.error && (
                  <p className="text-xs text-destructive">{upload.error}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}






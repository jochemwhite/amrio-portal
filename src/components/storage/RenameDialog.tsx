'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import type { RenameDialogProps } from './types'

export const RenameDialog: React.FC<RenameDialogProps> = ({
  open,
  onOpenChange,
  file,
  onConfirm,
}) => {
  const [nameWithoutExtension, setNameWithoutExtension] = useState('')
  const [altText, setAltText] = useState('')

  // Extract file extension and name without extension
  const { extension, baseFileName } = useMemo(() => {
    if (!file) return { extension: '', baseFileName: '' }
    
    const lastDotIndex = file.name.lastIndexOf('.')
    if (lastDotIndex === -1 || lastDotIndex === 0) {
      // No extension or hidden file (e.g., .gitignore)
      return { extension: '', baseFileName: file.name }
    }
    
    return {
      extension: file.name.substring(lastDotIndex), // includes the dot
      baseFileName: file.name.substring(0, lastDotIndex),
    }
  }, [file])

  useEffect(() => {
    if (file) {
      setNameWithoutExtension(baseFileName)
      setAltText(file.altText || '')
    }
  }, [file, baseFileName])

  const handleConfirm = () => {
    if (!file || !nameWithoutExtension.trim()) return
    
    // Reconstruct full filename with original extension
    const fullFileName = nameWithoutExtension.trim() + extension
    onConfirm(file.id, fullFileName, altText.trim() || undefined)
    onOpenChange(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && nameWithoutExtension.trim()) {
      handleConfirm()
    }
  }

  if (!file) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Rename File</DialogTitle>
          <DialogDescription>
            Update the filename and optional alt text for accessibility.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="filename">Filename</Label>
            <div className="flex items-center gap-2">
              <Input
                id="filename"
                value={nameWithoutExtension}
                onChange={(e) => setNameWithoutExtension(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter filename"
                autoFocus
                className="flex-1"
              />
              {extension && (
                <Badge variant="secondary" className="px-3 py-1 text-sm font-mono">
                  {extension}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              File extension is protected and cannot be changed
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="alttext">Alt Text (optional)</Label>
            <Input
              id="alttext"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the image for accessibility"
            />
            <p className="text-xs text-muted-foreground">
              Used for screen readers and when the image fails to load
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!nameWithoutExtension.trim()}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


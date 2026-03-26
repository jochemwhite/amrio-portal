"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Image as ImageIcon, FolderOpen, Loader2, AlertTriangle } from "lucide-react";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { FieldComponentProps } from "@/stores/content-editor-store";
import {
  MediaImagePickerDialog,
  type SelectedMediaImage,
} from "./media_image_picker_dialog";

export default function Image({ field, fieldId, value, handleFieldChange }: FieldComponentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showSizeHelp, setShowSizeHelp] = useState(false);
  const isUploading = false;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleImageSelection = (image: SelectedMediaImage) => {
    handleFieldChange(field.id, image);
    setIsOpen(false);
  }

  const handleRemove = () => {
    handleFieldChange(field.id, null);
  };

  // Check if image is too large for web (>500KB)
  const isImageTooLarge = value && value.size > 500 * 1024; // 500KB threshold
  const imageSizeMB = value ? (value.size / (1024 * 1024)).toFixed(2) : 0;

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId}>
        {field.name}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-4 transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          isUploading && "opacity-50 pointer-events-none"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {value ? (
          <div className="space-y-3">
            <div className="relative w-full max-h-80 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
              <img 
                src={value.url} 
                alt={value.name} 
                className="max-h-80 w-auto object-contain"
              />
            </div>
            
            {/* Warning for large images */}
            {isImageTooLarge && (
              <Alert variant="destructive" className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <span className="font-semibold">Large image detected ({imageSizeMB} MB)</span>
                      <p className="text-sm mt-1">
                        This image may slow down your website for visitors. Large images take longer to load, especially on mobile devices or slower internet connections.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSizeHelp(true)}
                      className="shrink-0 border-amber-300 hover:bg-amber-100 dark:border-amber-800 dark:hover:bg-amber-900/50"
                    >
                      Learn More
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{value.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={cn(
                      isImageTooLarge && "text-amber-600 dark:text-amber-500 font-medium"
                    )}>
                      {(value.size / 1024).toFixed(1)} KB
                    </span>
                    {value.width && value.height && (
                      <span>• {value.width} × {value.height}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(true)}>
                    Change
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemove}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* SEO Fields */}
              <div className="space-y-3 pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground">SEO & Accessibility</p>
                
                <div className="space-y-1.5">
                  <Label htmlFor={`${fieldId}-alt`} className="text-xs">
                    Alt Text (Alternative Text)
                    <span className="text-muted-foreground font-normal ml-1">- Recommended for SEO</span>
                  </Label>
                  <Input
                    id={`${fieldId}-alt`}
                    type="text"
                    placeholder="Describe the image for screen readers and search engines..."
                    value={value.altText || ''}
                    onChange={(e) => handleFieldChange(field.id, { ...value, altText: e.target.value })}
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Helps visually impaired users and improves search rankings. Be descriptive but concise.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`${fieldId}-title`} className="text-xs">
                    Image Title (Optional)
                  </Label>
                  <Input
                    id={`${fieldId}-title`}
                    type="text"
                    placeholder="Custom title for this image..."
                    value={value.customTitle || ''}
                    onChange={(e) => handleFieldChange(field.id, { ...value, customTitle: e.target.value })}
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Appears as tooltip when hovering over the image
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </div>
            ) : (
              <>
                <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Drag and drop an image or click to browse
                </p>
                <Button type="button" variant="outline" className="mt-4" onClick={() => setIsOpen(true)}>
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Select Image
                </Button>
              </>
            )}
          </div>
        )}
      </div>
      {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}

      <MediaImagePickerDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        onSelect={handleImageSelection}
      />

      {/* Image Size Help Dialog */}
      <Dialog open={showSizeHelp} onOpenChange={setShowSizeHelp}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Understanding Image Sizes for Your Website
            </DialogTitle>
            <DialogDescription>
              Learn how to optimize images for better website performance
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Why it matters */}
            <div>
              <h3 className="font-semibold text-base mb-2">Why Image Size Matters</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                When someone visits your website, their browser needs to download all the images before displaying them. Large images take longer to download, which means:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>Visitors wait longer to see your content (especially on phones)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>People with slow internet or limited data plans have a poor experience</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>Search engines may rank your site lower for being slow</span>
                </li>
              </ul>
            </div>

            {/* Recommended sizes */}
            <div>
              <h3 className="font-semibold text-base mb-2">Recommended Image Sizes</h3>
              <div className="bg-muted rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">Hero/Banner Images</p>
                    <p className="text-xs text-muted-foreground">Full-width images at the top of pages</p>
                  </div>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-500">Under 200 KB</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">Content Images</p>
                    <p className="text-xs text-muted-foreground">Images within articles or pages</p>
                  </div>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-500">Under 150 KB</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">Thumbnails & Icons</p>
                    <p className="text-xs text-muted-foreground">Small preview images or icons</p>
                  </div>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-500">Under 50 KB</span>
                </div>
              </div>
            </div>

            {/* How to make smaller */}
            <div>
              <h3 className="font-semibold text-base mb-2">How to Make Images Smaller</h3>
              <div className="space-y-3">
                <div className="border-l-2 border-primary pl-3">
                  <p className="font-medium text-sm mb-1">1. Use Online Compression Tools</p>
                  <p className="text-sm text-muted-foreground">Free websites that reduce image size without losing quality:</p>
                  <ul className="mt-1 text-sm text-muted-foreground space-y-0.5">
                    <li>• <span className="font-medium">TinyPNG.com</span> - Great for PNG and JPG files</li>
                    <li>• <span className="font-medium">Squoosh.app</span> - Advanced options and formats</li>
                    <li>• <span className="font-medium">ImageOptim.com</span> - Batch compression tool</li>
                  </ul>
                </div>

                <div className="border-l-2 border-primary pl-3">
                  <p className="font-medium text-sm mb-1">2. Resize Before Uploading</p>
                  <p className="text-sm text-muted-foreground">
                    If your image is 4000px wide but your website only displays it at 1200px, resize it first. Use free tools like:
                  </p>
                  <ul className="mt-1 text-sm text-muted-foreground space-y-0.5">
                    <li>• <span className="font-medium">Canva.com</span> - Easy resizing with templates</li>
                    <li>• <span className="font-medium">Pixlr.com</span> - Online photo editor</li>
                    <li>• <span className="font-medium">Windows Photos</span> or <span className="font-medium">Mac Preview</span> - Built-in apps</li>
                  </ul>
                </div>

                <div className="border-l-2 border-primary pl-3">
                  <p className="font-medium text-sm mb-1">3. Choose the Right Format</p>
                  <p className="text-sm text-muted-foreground">Different formats work better for different images:</p>
                  <ul className="mt-1 text-sm text-muted-foreground space-y-0.5">
                    <li>• <span className="font-medium">JPEG</span> - Best for photos (smaller files)</li>
                    <li>• <span className="font-medium">PNG</span> - Best for graphics with text or transparency</li>
                    <li>• <span className="font-medium">WebP</span> - Modern format, smallest files (if supported)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Quick tip */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">💡 Quick Tip</p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                As a rule of thumb: If an image is over 500 KB, it&apos;s probably too large for the web. Try to keep most images under 200 KB for the best experience.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setShowSizeHelp(false)}>
              Got it, thanks!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

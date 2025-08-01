import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import React, { useRef } from "react";

export default function Image({ field, fieldId, value, error, handleFieldChange, handleFieldBlur }: any) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // For now, just store the file name. In a real app, you'd upload to a service
      handleFieldChange(field.id, {
        name: file.name,
        size: file.size,
        type: file.type,
        // In production, you'd upload the file and store the URL
        url: URL.createObjectURL(file),
      });
    }
  };

  const handleRemove = () => {
    handleFieldChange(field.id, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId}>
        {field.name}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
        {value ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {value.url && (
                <img 
                  src={value.url} 
                  alt={value.name} 
                  className="w-12 h-12 object-cover rounded"
                />
              )}
              <div>
                <p className="text-sm font-medium">{value.name}</p>
                <p className="text-xs text-gray-500">
                  {(value.size / 1024).toFixed(1)}KB
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <Upload className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">Click to upload an image</p>
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              onBlur={() => handleFieldBlur(field)}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2"
            >
              Choose File
            </Button>
          </div>
        )}
      </div>
      
      {error && <p className="text-sm text-destructive">{error}</p>}
      {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
    </div>
  );
}
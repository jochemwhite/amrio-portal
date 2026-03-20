"use client";

import { updateUserProfileImage } from "@/actions/authentication/user-settings";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/supabaseClient";
import { cn } from "@/lib/utils";
import { Database } from "@/types/supabase";
import { Camera } from "lucide-react";
import Image from "next/image";
import React, { useRef, useState } from "react";
import { toast } from "sonner";

interface ImageSectionProps {
  user: Database["public"]["Tables"]["users"]["Row"];
  staggerIndex?: number;
}

export const ImageSection: React.FC<ImageSectionProps> = ({
  user,
  staggerIndex = 0,
}) => {
  const [profileImage, setProfileImage] = useState<string | null>(user.avatar);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleUpload = async (file: File) => {
    // Check file type
    if (!file.type.startsWith("image/")) {
      toast.warning("Invalid file type", {
        description: "Please upload an image file",
      });
      return;
    }
    setIsLoading(true);
    // Create a preview of the image
    const reader = new FileReader();
    reader.onload = (e) => {
      setProfileImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    toast.promise(
      async () => {
        const { success, error } = await updateUserProfileImage(file);
        if (!success) {
          throw error || "Failed to upload profile image";
        }
        return true;
      },
      {
        loading: "Uploading profile image...",
        success: "Profile image uploaded successfully",
        error: (error) => {
          return error;
        },
        finally() {
          setIsLoading(false);
        },
      },
    );
  };

  const handleRemoveImage = async () => {
    setIsLoading(true);
    const fileType = profileImage?.split(".")[3];

    const imgPath = "profile_images/" + user.id + "-profile_image." + fileType;

    const { error } = await supabase.storage.from("users").remove([imgPath]);

    if (error) {
      toast.error("Failed to remove image");
      return;
    }

    const { error: datebaseError } = await supabase
      .from("users")
      .update({ avatar: null })
      .eq("id", user.id);

    if (datebaseError) {
      console.log(datebaseError);
      toast.error("Failed to remove image");
      return;
    }

    // Would delete from Supabase storage here
    setProfileImage(null);
    setIsLoading(false);

    toast.success("Profile image removed", {
      description: "Your profile image has been removed",
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  return (
    <Card
      data-stagger-index={staggerIndex}
      className="overflow-hidden border-border/60 bg-card/80 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/70"
    >
      <CardHeader className="space-y-1.5 pb-4">
        <CardTitle className="text-xl font-semibold tracking-tight">
          Profile Image
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Manage your profile picture
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-col items-center text-center">
          <div
            className={cn(
              "group relative mb-5 h-32 w-32 cursor-pointer overflow-hidden rounded-full ring-1 ring-border/70 transition-all-medium",
              "hover:ring-primary/40",
              { "ring-4 ring-primary/30": isDragging },
            )}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {profileImage ? (
              <>
                <Image
                  src={profileImage}
                  alt="Profile"
                  fill
                  className="object-cover"
                  sizes="128px"
                  unoptimized
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all-medium">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted/50 text-muted-foreground">
                <div className="flex flex-col items-center">
                  <Camera className="h-6 w-6 mb-1" />
                  <span className="text-xs">Add Image</span>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <svg
                  className="animate-spin h-10 w-10 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={isLoading}
          />

          <div className="max-w-xs rounded-md border border-dashed border-border/70 bg-muted/15 px-4 py-3 text-sm text-muted-foreground mb-4">
            Click on the image to upload a new one, or drag and drop an image
            file.
            <p className="mt-1 text-xs">Maximum file size: 5MB</p>
          </div>

          <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              Upload Image
            </Button>

            {profileImage && (
              <Button
                variant="destructive"
                onClick={handleRemoveImage}
                disabled={isLoading}
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

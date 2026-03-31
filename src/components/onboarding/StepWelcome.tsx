"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

import { updateUserProfile } from "@/actions/onboarding";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { onboardingProfileSchema } from "@/schemas/onboarding";

type OnboardingProfileFormValues = z.input<typeof onboardingProfileSchema>;

interface StepWelcomeProps {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  nextStep: number;
}

export function StepWelcome({
  userId,
  email,
  firstName,
  lastName,
  avatar,
  nextStep,
}: StepWelcomeProps) {
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatar);
  const [fileError, setFileError] = useState<string | null>(null);

  const form = useForm<OnboardingProfileFormValues>({
    resolver: zodResolver(onboardingProfileSchema),
    defaultValues: {
      first_name: firstName ?? "",
      last_name: lastName ?? "",
      avatar: undefined,
    },
  });

  useEffect(() => {
    form.reset({
      first_name: firstName ?? "",
      last_name: lastName ?? "",
      avatar: undefined,
    });
    setPreviewUrl(avatar);
    setFileError(null);
  }, [avatar, firstName, form, lastName]);

  const handleAvatarChange = (file: File | null) => {
    setFileError(null);

    if (!file) {
      form.setValue("avatar", undefined);
      setPreviewUrl(avatar);
      return;
    }

    const parsed = onboardingProfileSchema.safeParse({
      first_name: form.getValues("first_name"),
      last_name: form.getValues("last_name"),
      avatar: file,
    });

    if (!parsed.success) {
      const avatarIssue = parsed.error.issues.find((issue) => issue.path[0] === "avatar");
      setFileError(avatarIssue?.message ?? "Invalid avatar file.");
      form.setValue("avatar", undefined);
      return;
    }

    form.setValue("avatar", file, { shouldValidate: true });
    setPreviewUrl(URL.createObjectURL(file));
  };

  const onSubmit = async (values: OnboardingProfileFormValues) => {
    const result = await updateUserProfile(userId, values);

    if (!result.success) {
      toast.error(result.error ?? "Failed to update profile");
      return;
    }

    toast.success("Profile updated");
    router.push(`/onboarding?step=${nextStep}`);
    router.refresh();
  };

  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.trim().toUpperCase() || email[0]?.toUpperCase() || "U";

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
        <p className="font-medium">Welcome, {firstName || email}!</p>
        <p className="mt-1 text-muted-foreground">{email}</p>
      </div>

      {fileError ? (
        <Alert variant="destructive">
          <AlertDescription>{fileError}</AlertDescription>
        </Alert>
      ) : null}

      <Form {...form}>
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-3 rounded-xl border p-4">
            <div className="flex items-center gap-4">
              <Avatar size="lg" className="size-16">
                {previewUrl ? <AvatarImage src={previewUrl} alt={email} /> : null}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="font-medium">Avatar</p>
                <p className="text-sm text-muted-foreground">
                  JPEG, PNG, or WebP. Maximum size 2MB.
                </p>
              </div>
            </div>

            <FormField
              control={form.control}
              name="avatar"
              render={() => (
                <FormItem>
                  <FormLabel htmlFor="avatar-upload">Upload avatar</FormLabel>
                  <FormControl>
                    <label
                      htmlFor="avatar-upload"
                      className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground hover:bg-muted/40"
                    >
                      <Upload className="size-4" />
                      Choose image
                      <Input
                        id="avatar-upload"
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => handleAvatarChange(event.target.files?.[0] ?? null)}
                      />
                    </label>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : null}
              Next
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

"use server";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/supabaseServerClient";
import { supabaseAdmin } from "@/lib/supabase/SupabaseAdminClient";
import { getPublicUrl } from "@/lib/r2/urls";
import { getR2Bucket, r2Client } from "@/server/utils/r2/client";
import { ActionResponse } from "@/types/actions";
import { Database } from "@/types/supabase";

type PublicUserRow = Database["public"]["Tables"]["users"]["Row"];
type TenantRow = Database["public"]["Tables"]["tenants"]["Row"];

type AuthUserMetadata = {
  pending_tenant_details?: boolean;
  tenant_id?: string;
};

type SafeTenantUpdateValues = {
  name: string;
  business_type: string;
  kvk_number?: string;
  vat_number?: string;
  contact_email: string;
  phone?: string;
  website?: string;
  address: string;
  address2?: string;
  postal_code: string;
  city: string;
  state_or_province?: string;
  country: string;
};

export interface OnboardingState {
  user: PublicUserRow;
  email: string;
  identities: Array<{ provider?: string }>;
  user_metadata: AuthUserMetadata;
  tenant: Pick<
    TenantRow,
    | "id"
    | "name"
    | "business_type"
    | "kvk_number"
    | "vat_number"
    | "contact_email"
    | "phone"
    | "website"
    | "address"
    | "address2"
    | "postal_code"
    | "city"
    | "state_or_province"
    | "country"
  > | null;
  membershipTenantId: string | null;
  membershipTenantName: string | null;
  pendingTenantDetails: boolean;
}

function sanitizeFilename(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  const extension = lastDot >= 0 ? filename.slice(lastDot).toLowerCase().replace(/[^a-z0-9.]/g, "") : "";
  const basename = (lastDot >= 0 ? filename.slice(0, lastDot) : filename)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "")
    .toLowerCase();

  return `${basename || "avatar"}${extension}`;
}

function normalizeOptional(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function ensureCurrentUser(expectedUserId: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || user.id !== expectedUserId) {
    return { supabase, user: null, error: "Unauthorized." };
  }

  return { supabase, user, error: null };
}

export async function getOnboardingState(userId: string): Promise<ActionResponse<OnboardingState>> {
  const { supabase, user, error: authError } = await ensureCurrentUser(userId);

  if (authError || !user) {
    return { success: false, error: authError ?? "Unauthorized." };
  }

  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (userError || !userRow) {
    console.log("user error")

    return { success: false, error: userError?.message ?? "Failed to load user." };
  }

  const { data: membership, error: memberShipError } = await supabase
    .from("user_tenants")
    .select("tenant_id, tenants(name)")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();


    if(!membership || memberShipError){
      console.log("memberShipError")
      return { success: false, error: memberShipError?.message ?? "Failed to load user." };
    }

  const userMetadata = (user.user_metadata ?? {}) as AuthUserMetadata;
  const pendingTenantDetails = Boolean(userMetadata.pending_tenant_details);
  const metadataTenantId = typeof userMetadata.tenant_id === "string" ? userMetadata.tenant_id : null;

  let tenant: OnboardingState["tenant"] = null;

  if (pendingTenantDetails && metadataTenantId) {
    const { data: tenantRow, error: tenantError } = await supabase
      .from("tenants")
      .select("id, name, business_type, kvk_number, vat_number, contact_email, phone, website, address, address2, postal_code, city, state_or_province, country")
      .eq("id", metadataTenantId)
      .single();

    if (tenantError || !tenantRow) {
      console.log("tenantError")
      
      return { success: false, error: tenantError?.message ?? "Failed to load tenant." };
    }

    tenant = tenantRow;
  }

  const membershipTenant = Array.isArray(membership?.tenants)
    ? membership?.tenants[0] ?? null
    : membership?.tenants ?? null;

  return {
    success: true,
    data: {
      user: userRow,
      email: user.email ?? userRow.email,
      identities: Array.isArray(user.identities) ? user.identities : [],
      user_metadata: userMetadata,
      tenant,
      membershipTenantId: membership?.tenant_id ?? metadataTenantId,
      membershipTenantName: membershipTenant?.name ?? tenant?.name ?? null,
      pendingTenantDetails,
    },
  };
}

export async function updateUserProfile(
  userId: string,
  values: { first_name: string; last_name: string; avatar?: File | null },
): Promise<ActionResponse<{ avatar: string | null }>> {
  const { supabase, user, error: authError } = await ensureCurrentUser(userId);

  if (authError || !user) {
    return { success: false, error: authError ?? "Unauthorized." };
  }

  let avatarUrl: string | null = null;

  if (values.avatar instanceof File && values.avatar.size > 0) {
    const uniqueFilename = `${crypto.randomUUID()}-${sanitizeFilename(values.avatar.name)}`;
    const storagePath = `avatars/${userId}/${uniqueFilename}`;
    const arrayBuffer = await values.avatar.arrayBuffer();

    await r2Client.send(new PutObjectCommand({
      Bucket: getR2Bucket(),
      Key: storagePath,
      Body: Buffer.from(arrayBuffer),
      ContentType: values.avatar.type,
      ContentLength: values.avatar.size,
    }));

    avatarUrl = getPublicUrl(storagePath);

    const tenantId =
      typeof user.user_metadata?.tenant_id === "string"
        ? user.user_metadata.tenant_id
        : (
          await supabase
            .from("user_tenants")
            .select("tenant_id")
            .eq("user_id", userId)
            .limit(1)
            .maybeSingle()
        ).data?.tenant_id ?? null;

    if (tenantId) {
      const { error: fileInsertError } = await supabase.from("files").insert({
        tenant_id: tenantId,
        filename: uniqueFilename,
        original_filename: values.avatar.name,
        mime_type: values.avatar.type,
        size_bytes: values.avatar.size,
        storage_path: storagePath,
        storage_bucket: getR2Bucket(),
        file_type: "image",
        uploaded_by: userId,
        upload_status: "confirmed",
      });

      if (fileInsertError) {
        return { success: false, error: fileInsertError.message };
      }
    }
  }

  const updatePayload: Database["public"]["Tables"]["users"]["Update"] = {
    first_name: values.first_name,
    last_name: values.last_name,
  };

  if (avatarUrl) {
    updatePayload.avatar = avatarUrl;
  }

  const { error: updateError } = await supabase
    .from("users")
    .update(updatePayload)
    .eq("id", userId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath("/onboarding");
  revalidatePath("/dashboard", "layout");

  return {
    success: true,
    data: {
      avatar: avatarUrl,
    },
  };
}

export async function updateTenantDetails(
  tenantId: string,
  userId: string,
  formValues: SafeTenantUpdateValues,
): Promise<ActionResponse<null>> {
  const { user, error: authError } = await ensureCurrentUser(userId);

  if (authError || !user) {
    return { success: false, error: authError ?? "Unauthorized." };
  }

  const safeUpdate: Database["public"]["Tables"]["tenants"]["Update"] = {
    name: formValues.name,
    business_type: formValues.business_type,
    kvk_number: normalizeOptional(formValues.kvk_number),
    vat_number: normalizeOptional(formValues.vat_number),
    contact_email: formValues.contact_email,
    phone: normalizeOptional(formValues.phone),
    website: normalizeOptional(formValues.website),
    address: formValues.address,
    address2: normalizeOptional(formValues.address2),
    postal_code: formValues.postal_code,
    city: formValues.city,
    state_or_province: normalizeOptional(formValues.state_or_province),
    country: formValues.country,
  };

  const { error: tenantUpdateError } = await supabaseAdmin
    .from("tenants")
    .update(safeUpdate)
    .eq("id", tenantId);

  if (tenantUpdateError) {
    return { success: false, error: tenantUpdateError.message };
  }

  const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...((user.user_metadata ?? {}) as AuthUserMetadata),
      pending_tenant_details: false,
    },
  });

  if (metadataError) {
    return { success: false, error: metadataError.message };
  }

  revalidatePath("/onboarding");
  revalidatePath("/dashboard", "layout");

  return { success: true, data: null };
}

export async function completeOnboarding(userId: string): Promise<ActionResponse<null>> {
  const { supabase, error: authError } = await ensureCurrentUser(userId);

  if (authError) {
    return { success: false, error: authError };
  }

  const { error } = await supabase
    .from("users")
    .update({ is_onboarded: true })
    .eq("id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/onboarding");
  revalidatePath("/dashboard", "layout");

  return { success: true, data: null };
}

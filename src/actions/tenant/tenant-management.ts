"use server";

import { TenantFormValues } from "@/components/admin/forms/tenant-form";
import { createClient } from "@/lib/supabase/supabaseServerClient";
import { createMoneybirdContact } from "@/server/moneybird/contacts";
import { createStripeCustomer } from "@/server/stripe/customers";
import { createCMSBucketFolder } from "@/server/tenant/create-cms-bucket-folder";
import { Database } from "@/types/supabase";

export async function createTenant(tenant: TenantFormValues) {
  const supabase = await createClient();
  
  let tenantId: string | null = null;
  

  const { data, error } = await supabase
    .from("tenants")
    .insert([
      {
        name: tenant.isBusinessContact ? tenant.company_name : `${tenant.firstname} ${tenant.lastname}`,
        address: tenant.address,
        address2: tenant.address2,
        city: tenant.city,
        state_or_province: tenant.stateOrProvince,
        postal_code: tenant.postal_code,
        country: tenant.country,
        billing_slug: tenant.billing_slug,
        phone: tenant.phone,
        contact_email: tenant.contact_email,
        vat_number: tenant.vat_number,
        kvk_number: tenant.kvk_number,
        logo_url: tenant.logo_url,
        notes: tenant.notes,
        website: tenant.website,
        business_type: tenant.isBusinessContact ? "company" : "individual",
        primary_contact_user_id: tenant.primary_contact_user_id,
      } as Database["public"]["Tables"]["tenants"]["Insert"],
    ])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  try {
    // create folder in cms storage
    await createCMSBucketFolder(data.id);

    const name = tenant.isBusinessContact ? tenant.company_name : `${tenant.firstname} ${tenant.lastname}`;

    if (!name) {
      throw new Error("Missing required fields for Stripe customer creation: email is required");
    }

    if (tenant.createStripe) {
      if (
        !tenant.contact_email ||
        !tenant.address ||
        !tenant.city ||
        !tenant.stateOrProvince ||
        !tenant.postal_code ||
        !tenant.country ||
        !tenant.phone
      ) {
        console.log("Missing required fields:", {
          contact_email: !tenant.contact_email,
          company_name: !tenant.company_name,
          address: !tenant.address,
          city: !tenant.city,
          stateOrProvince: !tenant.stateOrProvince,
          postal_code: !tenant.postal_code,
          country: !tenant.country,
          phone: !tenant.phone,
        });
        throw new Error("Missing required fields for Stripe customer creation: email, name, and address are required");
      }

      await createStripeCustomer({
        email: tenant.contact_email,
        name: name,
        phone: tenant.phone,
        address: {
          line1: tenant.address,
          line2: tenant.address2 || "",
          city: tenant.city,
          state: tenant.stateOrProvince,
          postal_code: tenant.postal_code,
          country: tenant.country,
        },
        tenantId: data.id,
      });
    }

    if (tenant.createMoneybird) {
      await createMoneybirdContact(
        {
          customer_id: data.id,
          company_name: tenant.company_name,
          firstname: tenant.firstname,
          lastname: tenant.lastname,
          address1: tenant.address,
          address2: tenant.address2,
          city: tenant.city,
          zipcode: tenant.postal_code,
          country: tenant.country,
          phone: tenant.phone,
          send_invoices_to_attention: tenant.contact_email,
          send_invoices_to_email: tenant.contact_email,
        },
        data.id
      );
    }

    return data;
  } catch (err) {
    // Rollback: Delete the tenant if any error occurs after creation
    console.error("Error during tenant setup, rolling back tenant creation:", err);
    
    await supabase
      .from("tenants")
      .delete()
      .eq("id", data.id);
    
    // Re-throw the original error
    throw err;
  }
}


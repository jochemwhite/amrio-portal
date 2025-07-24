import { createClient } from "@/lib/supabase/supabaseServerClient";
import { checkRequiredRoles } from "@/server/auth/check-required-roles";
import { redirect } from "next/navigation";
import { WebsiteManagement } from "@/components/admin/websites/WebsiteManagement";

export default async function AdminWebsitesPage() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return redirect("/");
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return redirect("/dashboard");
  }

  // Fetch websites
  const { data: websites, error: websitesError } = await supabase
    .from("cms_websites")
    .select(`
      *,
      cms_pages (
        id,
        name,
        status
      )
    `)
    .order("created_at", { ascending: false });

  if (websitesError) {
    console.error("Error fetching websites:", websitesError);
  }

  // Fetch tenants for the website creation form
  const { data: tenants, error: tenantsError } = await supabase
    .from("tenants")
    .select("id, name")
    .order("name");

  if (tenantsError) {
    console.error("Error fetching tenants:", tenantsError);
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Website Management</h1>
        <p className="text-muted-foreground">Manage CMS websites and their pages.</p>
      </div>
      
      <WebsiteManagement 
        initialWebsites={websites || []} 
        availableTenants={tenants || []}
      />
    </div>
  );
} 
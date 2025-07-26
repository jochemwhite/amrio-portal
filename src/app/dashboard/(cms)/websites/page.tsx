import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Globe } from "lucide-react";
import { Website } from "@/types/cms";
import { createClient } from "@/lib/supabase/supabaseServerClient";
import { getActiveTenantId } from "@/lib/utils/active-tenant-server";
import Link from "next/link";

export default async function WebsitesClientOverview() {
  const supabase = await createClient();
  const tenantId = await getActiveTenantId();

  if (!tenantId) {
    return <div>No tenant found</div>;
  }

  const { data: websites, error } = await supabase
    .from("cms_websites")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
  }

  if (!websites) {
    return <div>No websites found</div>;
  }
  const stats = {
    total: websites.length,
    active: websites.filter((w) => w.status === "active").length,
    inactive: websites.filter((w) => w.status === "inactive").length,
    maintenance: websites.filter((w) => w.status === "maintenance").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your Websites</h1>
        <p className="text-muted-foreground">Overview of your CMS websites</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactive}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.maintenance}</div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Websites</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {websites.map((website) => (
                <TableRow key={website.id}>
                  <TableCell>
                    <Link href={`/dashboard/websites/${website.id}`}>{website.name}</Link>
                  </TableCell>
                  <TableCell>
                    <a href={`https://${website.domain}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {website.domain}
                    </a>
                  </TableCell>
                  <TableCell>
                    <Badge variant={website.status === "active" ? "default" : "secondary"}>{website.status}</Badge>
                  </TableCell>
                  <TableCell>{website.created_at ? new Date(website.created_at).toLocaleDateString() : "Unknown"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

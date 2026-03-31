import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminUserNotFound() {
  return (
    <div className="container mx-auto py-10">
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle>User not found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The requested user could not be found or is no longer available.
          </p>
          <Button asChild variant="outline">
            <Link href="/admin/users">Back to users</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

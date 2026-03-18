import { Card, CardContent } from "@/components/ui/card";
import React from "react";

export default function NoSectionsFound() {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <p className="text-muted-foreground">No content sections found. Please add sections in the Schema Builder first.</p>
      </CardContent>
    </Card>
  );
}

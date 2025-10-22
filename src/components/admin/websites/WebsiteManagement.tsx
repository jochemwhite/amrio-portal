"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Globe, Edit, Trash2, Eye } from "lucide-react";
import { WebsiteForm } from "./WebsiteForm";
import { Website } from "@/types/cms";
import { toast } from "sonner";
import { deleteWebsite } from "@/actions/cms/website-actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

interface WebsiteManagementProps {
  initialWebsites: any[];
  availableTenants: { id: string; name: string }[];
}

export function WebsiteManagement({ initialWebsites, availableTenants }: WebsiteManagementProps) {
  const [websites, setWebsites] = useState(initialWebsites);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState<any | null>(null);

  const handleCreateWebsite = () => {
    setEditingWebsite(null);
    setIsFormOpen(true);
  };

  const handleEditWebsite = (website: any) => {
    setEditingWebsite(website);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingWebsite(null);
  };

  const handleFormSuccess = (website: Website) => {
    if (editingWebsite) {
      // Update existing website
      setWebsites(prev => prev.map(w => w.id === website.id ? { ...w, ...website } : w));
      toast.success("Website updated successfully");
    } else {
      // Add new website
      setWebsites(prev => [{ ...website, cms_pages: [] }, ...prev]);
      toast.success("Website created successfully");
    }
    setIsFormOpen(false);
    setEditingWebsite(null);
  };

  const handleDeleteWebsite = async (websiteId: string) => {
    try {
      const result = await deleteWebsite(websiteId);
      if (result.success) {
        setWebsites(prev => prev.filter(w => w.id !== websiteId));
        toast.success("Website deleted successfully");
      } else {
        toast.error(result.error || "Failed to delete website");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'maintenance':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Websites</h2>
          <p className="text-sm text-muted-foreground">
            {websites.length} {websites.length === 1 ? 'website' : 'websites'} total
          </p>
        </div>
        <Button onClick={handleCreateWebsite}>
          <Plus className="w-4 h-4 mr-2" />
          Create Website
        </Button>
      </div>

      {/* Websites Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Websites</CardTitle>
        </CardHeader>
        <CardContent>
          {websites.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No websites yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first website to get started with the CMS.
              </p>
              <Button onClick={handleCreateWebsite}>
                <Plus className="w-4 h-4 mr-2" />
                Create Website
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pages</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {websites.map((website) => (
                  <TableRow key={website.id}>
                    <TableCell className="font-medium">{website.name}</TableCell>
                    <TableCell>
                      <a 
                        href={`https://${website.domain}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {website.domain}
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(website.status)}>
                        {website.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {website.cms_pages?.length || 0} page{website.cms_pages?.length !== 1 ? 's' : ''}
                    </TableCell>
                    <TableCell>
                      {website.created_at ? new Date(website.created_at).toLocaleDateString() : 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditWebsite(website)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            // Set active website and navigate to pages
                            // Note: This would need the useActiveWebsite hook in admin context
                            window.location.href = '/dashboard/pages';
                          }}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Pages
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Website</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{website.name}"? This action cannot be undone and will also delete all associated pages, sections, and fields.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteWebsite(website.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Website Form Dialog */}
      <WebsiteForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        website={editingWebsite}
        availableTenants={availableTenants}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
} 
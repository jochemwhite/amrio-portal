import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { DeleteUser } from "@/actions/authentication/user-management";
import { PageForm } from "../forms/PageForm";
import { Page } from "@/types/cms";
import { Database } from "@/types/supabase";

interface Props {
  isFormOpen: boolean;
  handleFormClose: () => void;
  page?: Database["public"]["Tables"]["cms_pages"]["Row"] & { cms_content_sections: number };
  websiteId: string;
  onSuccess: (data: Database["public"]["Tables"]["cms_pages"]["Row"] & { cms_content_sections: number }) => void;
}

export default function PageFormModal({ isFormOpen, handleFormClose, page, websiteId, onSuccess }: Props) {
  return (
    <Modal open={isFormOpen} onOpenChange={handleFormClose} title="Page Form" description="This is the page form" contentClassName="max-w-sm">
      <PageForm isOpen={isFormOpen} onClose={handleFormClose} page={page} websiteId={websiteId} onSuccess={onSuccess} />
    </Modal>
  );
}

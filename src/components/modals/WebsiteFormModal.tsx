import { Modal } from "@/components/ui/modal";
import { WebsiteForm } from "../forms/WebsiteForm";
import { Database } from "@/types/supabase";

type Website = Database["public"]["Tables"]["cms_websites"]["Row"];

interface Props {
  isFormOpen: boolean;
  handleFormClose: () => void;
  website?: Website;
  onSuccess: (data: Website) => void;
}

export default function WebsiteFormModal({ isFormOpen, handleFormClose, website, onSuccess }: Props) {
  return (
    <Modal
      open={isFormOpen}
      onOpenChange={handleFormClose}
      title={website ? "Edit Website" : "Create Website"}
      description="Manage your website settings"
      contentClassName="max-w-2xl"
    >
      <WebsiteForm isOpen={isFormOpen} onClose={handleFormClose} website={website} onSuccess={onSuccess} />
    </Modal>
  );
}


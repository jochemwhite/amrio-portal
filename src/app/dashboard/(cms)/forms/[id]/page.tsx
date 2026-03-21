import { getFormById } from "@/actions/cms/form-actions";
import { FormBuilderEditor } from "@/components/cms/forms/form-builder-editor";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface FormBuilderPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Form Builder",
  description: "Edit form structure and publishing state.",
};

export default async function FormBuilderPage({ params }: FormBuilderPageProps) {
  const { id } = await params;

  const formResult = await getFormById(id);
  if (!formResult.success || !formResult.data) {
    notFound();
  }

  return <FormBuilderEditor form={formResult.data} />;
}

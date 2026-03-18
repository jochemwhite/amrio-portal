import { getSchemaById, updateSchemaStructure } from "@/actions/cms/schema-actions";
import { SchemaBuilder } from "@/components/cms/schema_builder/schema_builder";
import { SchemaSavePayload } from "@/types/schema_builder";
import { map_schema_to_document } from "@/utils/schema/schema_builder_mapper";
import { notFound } from "next/navigation";

type SchemaPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SchemaPage({ params }: SchemaPageProps) {
  console.log("dfs")
  const { id } = await params;
  const schemaResponse = await getSchemaById(id);


  console.log(`ID: ${id}` )

  if (!schemaResponse.success || !schemaResponse.data) {
    const normalizedError = schemaResponse.error?.toLowerCase() ?? "";
    if (normalizedError.includes("not found")) {
      notFound();
    }

    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/4 p-8">
          <h1 className="text-2xl font-semibold">Unable to load schema</h1>
          <p className="mt-3 text-sm text-slate-400">
            {schemaResponse.error ??
              "Something went wrong while fetching this schema."}
          </p>
        </div>
      </main>
    );
  }

  async function save_schema_action(payload: SchemaSavePayload) {
    "use server";

    return updateSchemaStructure(id, payload);
  }

  return (
    <SchemaBuilder
      key={schemaResponse.data.id}
      initialDocument={map_schema_to_document(schemaResponse.data)}
      saveSchemaAction={save_schema_action}
    />
  );
}




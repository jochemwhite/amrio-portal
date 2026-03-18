import { arrayMove } from "@dnd-kit/sortable";

import type {
  SchemaField,
  SchemaSection,
  SupabaseSchemaWithRelations,
} from "@/types/cms";

type SupabaseSchemaSection = SupabaseSchemaWithRelations["cms_schema_sections"][number];
type SupabaseSchemaField = SupabaseSchemaSection["cms_schema_fields"][number];

export interface PendingChange {
  type: "create" | "update" | "delete" | "reorder";
  entity: "section" | "field" | "sections" | "fields";
  id?: string;
  tempId?: string;
}

export interface FieldLocation {
  sectionId: string;
  parentFieldId: string | null;
  index: number;
}

export interface ContainerRef {
  sectionId: string;
  parentFieldId: string | null;
}

export interface FieldMove {
  fieldId: string;
  from: FieldLocation;
  to: FieldLocation;
}

export function isTempId(id: string | null | undefined): id is string {
  return typeof id === "string" && id.startsWith("temp_");
}

function normalizeField(field: SupabaseSchemaField, sectionId: string): SchemaField {
  return {
    ...field,
    field_key: field.field_key ?? "",
    required: field.required ?? false,
    default_value: field.default_value ?? null,
    validation: field.validation ?? null,
    settings: field.settings ?? null,
    order: field.order ?? 0,
    parent_field_id: field.parent_field_id ?? null,
    schema_section_id: field.schema_section_id ?? sectionId,
    collection_id: field.collection_id ?? null,
    created_at: field.created_at ?? undefined,
    updated_at: field.updated_at ?? undefined,
  };
}

function normalizeSection(
  section: SupabaseSchemaSection,
  schemaId: string,
): SchemaSection {
  const fields = [...(section.cms_schema_fields ?? [])]
    .map((field) => normalizeField(field, section.id))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return {
    ...section,
    description: section.description ?? null,
    order: section.order ?? 0,
    schema_id: section.schema_id ?? schemaId,
    created_at: section.created_at ?? undefined,
    updated_at: section.updated_at ?? undefined,
    cms_schema_fields: fields,
  };
}

export function normalizeSchemaSections(
  schema: SupabaseSchemaWithRelations,
): SchemaSection[] {
  return [...(schema.cms_schema_sections ?? [])]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((section) => normalizeSection(section, schema.id))
    .map((section, index) => ({
      ...section,
      order: index,
    }));
}

export function cloneSections(sections: SchemaSection[]): SchemaSection[] {
  return sections.map((section) => ({
    ...section,
    cms_schema_fields: (section.cms_schema_fields ?? []).map((field) => ({
      ...field,
      settings: field.settings ? { ...field.settings } : null,
    })),
  }));
}

export function findSectionIndex(
  sectionId: string,
  sections: SchemaSection[],
): number {
  return sections.findIndex((section) => section.id === sectionId);
}

export function makeContainerId(
  sectionId: string,
  parentFieldId: string | null,
): string {
  return `${sectionId}::${parentFieldId ?? "root"}`;
}

export function parseContainerId(containerId: string): ContainerRef | null {
  const [sectionId, rawParentFieldId] = containerId.split("::");

  if (!sectionId) {
    return null;
  }

  return {
    sectionId,
    parentFieldId:
      rawParentFieldId && rawParentFieldId !== "root" ? rawParentFieldId : null,
  };
}

export function getFieldsForContainer(
  section: SchemaSection,
  parentFieldId: string | null,
): SchemaField[] {
  return [...(section.cms_schema_fields ?? [])]
    .filter((field) => (field.parent_field_id ?? null) === parentFieldId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function findFieldLocation(
  fieldId: string,
  sections: SchemaSection[],
): FieldLocation | null {
  for (const section of sections) {
    const allFields = section.cms_schema_fields ?? [];
    const field = allFields.find((candidate) => candidate.id === fieldId);

    if (!field) {
      continue;
    }

    const parentFieldId = field.parent_field_id ?? null;
    const siblings = getFieldsForContainer(section, parentFieldId);
    const index = siblings.findIndex((candidate) => candidate.id === fieldId);

    if (index !== -1) {
      return {
        sectionId: section.id,
        parentFieldId,
        index,
      };
    }
  }

  return null;
}

export function replaceContainerFields(
  section: SchemaSection,
  parentFieldId: string | null,
  nextChildren: SchemaField[],
): SchemaSection {
  const untouchedFields = (section.cms_schema_fields ?? []).filter(
    (field) => (field.parent_field_id ?? null) !== parentFieldId,
  );

  const normalizedChildren = nextChildren.map((field, index) => ({
    ...field,
    parent_field_id: parentFieldId,
    schema_section_id: section.id,
    order: index,
  }));

  return {
    ...section,
    cms_schema_fields: [...untouchedFields, ...normalizedChildren],
  };
}

export function collectDescendantFieldIds(
  fields: SchemaField[],
  parentId: string,
): string[] {
  const directChildren = fields.filter(
    (field) => (field.parent_field_id ?? null) === parentId,
  );

  return directChildren.flatMap((child) => [
    child.id,
    ...collectDescendantFieldIds(fields, child.id),
  ]);
}

export function removeFieldTree(
  section: SchemaSection,
  fieldId: string,
): SchemaSection {
  const allFields = section.cms_schema_fields ?? [];
  const field = allFields.find((candidate) => candidate.id === fieldId);

  if (!field) {
    return section;
  }

  const parentFieldId = field.parent_field_id ?? null;
  const idsToDelete = new Set([
    fieldId,
    ...collectDescendantFieldIds(allFields, fieldId),
  ]);

  const nextSection = {
    ...section,
    cms_schema_fields: allFields.filter((candidate) => !idsToDelete.has(candidate.id)),
  };

  return normalizeContainerAfterRemoval(nextSection, parentFieldId);
}

export function normalizeContainerAfterRemoval(
  section: SchemaSection,
  parentFieldId: string | null,
): SchemaSection {
  const normalizedChildren = getFieldsForContainer(section, parentFieldId).map(
    (field, index) => ({
      ...field,
      order: index,
      parent_field_id: parentFieldId,
      schema_section_id: section.id,
    }),
  );

  return replaceContainerFields(section, parentFieldId, normalizedChildren);
}

function getFieldTree(section: SchemaSection, fieldId: string): SchemaField[] {
  const allFields = section.cms_schema_fields ?? [];
  const ids = new Set([fieldId, ...collectDescendantFieldIds(allFields, fieldId)]);

  return allFields
    .filter((field) => ids.has(field.id))
    .map((field) => ({ ...field }));
}

export function moveField(
  sections: SchemaSection[],
  { fieldId, from, to }: FieldMove,
): SchemaSection[] {
  if (from.index < 0 || to.index < 0) {
    return sections;
  }

  const sourceSection = sections.find((section) => section.id === from.sectionId);
  const targetSection = sections.find((section) => section.id === to.sectionId);

  if (!sourceSection || !targetSection) {
    return sections;
  }

  const sourceChildren = getFieldsForContainer(sourceSection, from.parentFieldId);
  let realFromIndex = from.index;

  if (
    sourceChildren[realFromIndex]?.id !== fieldId ||
    realFromIndex >= sourceChildren.length
  ) {
    realFromIndex = sourceChildren.findIndex((field) => field.id === fieldId);
  }

  if (realFromIndex === -1) {
    return sections;
  }

  const movingField = sourceChildren[realFromIndex];

  if (!movingField) {
    return sections;
  }

  const sameSection = from.sectionId === to.sectionId;
  const sameContainer = sameSection && from.parentFieldId === to.parentFieldId;

  if (sameContainer) {
    const safeToIndex = Math.max(0, Math.min(to.index, sourceChildren.length - 1));
    const reorderedChildren = arrayMove(sourceChildren, realFromIndex, safeToIndex);

    return sections.map((section) =>
      section.id === from.sectionId
        ? replaceContainerFields(section, from.parentFieldId, reorderedChildren)
        : section,
    );
  }

  if (sameSection) {
    const nextSourceChildren = [...sourceChildren];
    nextSourceChildren.splice(realFromIndex, 1);

    const targetChildren = getFieldsForContainer(targetSection, to.parentFieldId);
    const safeToIndex = Math.max(0, Math.min(to.index, targetChildren.length));
    const nextTargetChildren = [...targetChildren];
    nextTargetChildren.splice(safeToIndex, 0, {
      ...movingField,
      parent_field_id: to.parentFieldId,
      schema_section_id: to.sectionId,
    });

    return sections.map((section) => {
      if (section.id !== from.sectionId) {
        return section;
      }

      let nextSection = replaceContainerFields(
        section,
        from.parentFieldId,
        nextSourceChildren,
      );

      nextSection = replaceContainerFields(
        nextSection,
        to.parentFieldId,
        nextTargetChildren,
      );

      return nextSection;
    });
  }

  const fieldTree = getFieldTree(sourceSection, fieldId);
  const treeIds = new Set(fieldTree.map((field) => field.id));
  const descendants = fieldTree
    .filter((field) => field.id !== fieldId)
    .map((field) => ({
      ...field,
      schema_section_id: to.sectionId,
    }));

  const movingRoot = fieldTree.find((field) => field.id === fieldId);

  if (!movingRoot) {
    return sections;
  }

  const sourceWithoutTree = {
    ...sourceSection,
    cms_schema_fields: (sourceSection.cms_schema_fields ?? []).filter(
      (field) => !treeIds.has(field.id),
    ),
  };

  const normalizedSource = normalizeContainerAfterRemoval(
    sourceWithoutTree,
    from.parentFieldId,
  );

  const targetWithTree = {
    ...targetSection,
    cms_schema_fields: [
      ...(targetSection.cms_schema_fields ?? []),
      ...descendants,
    ],
  };

  const targetChildren = getFieldsForContainer(targetWithTree, to.parentFieldId);
  const safeToIndex = Math.max(0, Math.min(to.index, targetChildren.length));
  const nextTargetChildren = [...targetChildren];
  nextTargetChildren.splice(safeToIndex, 0, {
    ...movingRoot,
    schema_section_id: to.sectionId,
    parent_field_id: to.parentFieldId,
  });

  const normalizedTarget = replaceContainerFields(
    targetWithTree,
    to.parentFieldId,
    nextTargetChildren,
  );

  return sections.map((section) => {
    if (section.id === from.sectionId) {
      return normalizedSource;
    }

    if (section.id === to.sectionId) {
      return normalizedTarget;
    }

    return section;
  });
}

export function reorderSections(
  sections: SchemaSection[],
  fromIndex: number,
  toIndex: number,
): SchemaSection[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= sections.length ||
    toIndex >= sections.length
  ) {
    return sections;
  }

  return arrayMove(sections, fromIndex, toIndex).map((section, index) => ({
    ...section,
    order: index,
  }));
}

function settingsSignature(settings: Record<string, any> | null | undefined): string {
  return JSON.stringify(settings ?? null);
}

function sectionMetaChanged(initialSection: SchemaSection, nextSection: SchemaSection) {
  return (
    initialSection.name !== nextSection.name ||
    (initialSection.description ?? null) !== (nextSection.description ?? null)
  );
}

function fieldMetaChanged(initialField: SchemaField, nextField: SchemaField) {
  return (
    initialField.name !== nextField.name ||
    initialField.field_key !== nextField.field_key ||
    initialField.type !== nextField.type ||
    (initialField.required ?? false) !== (nextField.required ?? false) ||
    (initialField.default_value ?? null) !== (nextField.default_value ?? null) ||
    (initialField.validation ?? null) !== (nextField.validation ?? null) ||
    settingsSignature(initialField.settings) !== settingsSignature(nextField.settings) ||
    (initialField.collection_id ?? null) !== (nextField.collection_id ?? null)
  );
}

function fieldPositionChanged(initialField: SchemaField, nextField: SchemaField) {
  return (
    (initialField.order ?? 0) !== (nextField.order ?? 0) ||
    (initialField.parent_field_id ?? null) !==
      (nextField.parent_field_id ?? null) ||
    initialField.schema_section_id !== nextField.schema_section_id
  );
}

export function buildPendingChanges(
  initialSections: SchemaSection[],
  nextSections: SchemaSection[],
): PendingChange[] {
  const changes: PendingChange[] = [];
  const initialSectionMap = new Map(initialSections.map((section) => [section.id, section]));
  const nextSectionMap = new Map(nextSections.map((section) => [section.id, section]));

  nextSections.forEach((section, index) => {
    const initialSection = initialSectionMap.get(section.id);

    if (!initialSection) {
      changes.push({
        type: "create",
        entity: "section",
        tempId: section.id,
      });
      return;
    }

    if (sectionMetaChanged(initialSection, section)) {
      changes.push({
        type: "update",
        entity: "section",
        id: section.id,
      });
    }

    if ((initialSection.order ?? 0) !== index) {
      changes.push({
        type: "reorder",
        entity: "sections",
        id: section.id,
      });
    }
  });

  initialSections.forEach((section) => {
    if (!nextSectionMap.has(section.id)) {
      changes.push({
        type: "delete",
        entity: "section",
        id: section.id,
      });
    }
  });

  const initialFields = initialSections.flatMap((section) => section.cms_schema_fields ?? []);
  const nextFields = nextSections.flatMap((section) => section.cms_schema_fields ?? []);
  const initialFieldMap = new Map(initialFields.map((field) => [field.id, field]));
  const nextFieldMap = new Map(nextFields.map((field) => [field.id, field]));

  nextFields.forEach((field) => {
    const initialField = initialFieldMap.get(field.id);

    if (!initialField) {
      changes.push({
        type: "create",
        entity: "field",
        tempId: field.id,
      });
      return;
    }

    if (fieldMetaChanged(initialField, field)) {
      changes.push({
        type: "update",
        entity: "field",
        id: field.id,
      });
    }

    if (fieldPositionChanged(initialField, field)) {
      changes.push({
        type: "reorder",
        entity: "fields",
        id: field.id,
      });
    }
  });

  initialFields.forEach((field) => {
    if (!nextFieldMap.has(field.id)) {
      changes.push({
        type: "delete",
        entity: "field",
        id: field.id,
      });
    }
  });

  return changes;
}

export function resolveSelectedSectionId(
  selectedSectionId: string | null,
  sections: SchemaSection[],
): string | null {
  if (
    selectedSectionId &&
    sections.some((section) => section.id === selectedSectionId)
  ) {
    return selectedSectionId;
  }

  return sections[0]?.id ?? null;
}

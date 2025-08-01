import { Section } from "@/types/cms";

// Maximum allowed nesting depth
export const MAX_NESTING_DEPTH = 3;

/**
 * Check if adding a section as a nested section would create a loop
 */
export function wouldCreateLoop(targetSection: Section, sectionToNest: Section, allSections: Section[]): boolean {
  // A section cannot contain itself
  if (targetSection.id === sectionToNest.id) {
    return true;
  }

  // Check if the section to nest already contains the target section (directly or indirectly)
  return hasAncestor(targetSection.id, sectionToNest, allSections);
}

/**
 * Recursively check if a section has a specific ancestor
 */
function hasAncestor(ancestorId: string, section: Section, allSections: Section[]): boolean {
  if (!section.sections || section.sections.length === 0) {
    return false;
  }

  // Check direct children
  for (const childSection of section.sections) {
    if (childSection.id === ancestorId) {
      return true;
    }

    // Recursively check children's children
    if (hasAncestor(ancestorId, childSection, allSections)) {
      return true;
    }
  }

  return false;
}

/**
 * Get sections that can be safely nested within a target section
 */
export function getAvailableSectionsForNesting(targetSection: Section, allSections: Section[]): Section[] {
  const currentDepth = calculateSectionDepth(targetSection);

  return allSections.filter((section) => {
    // Don't allow nesting if it would exceed max depth
    if (currentDepth >= MAX_NESTING_DEPTH) {
      return false;
    }

    // Don't allow the section to nest itself
    if (section.id === targetSection.id) {
      return false;
    }

    // Don't allow nesting if it would create a loop
    if (wouldCreateLoop(targetSection, section, allSections)) {
      return false;
    }

    // Don't allow nesting sections that are already nested elsewhere
    // (optional - you might want to allow the same section in multiple places)
    if (isSectionAlreadyNested(section, allSections)) {
      return false;
    }

    return true;
  });
}

/**
 * Calculate the current depth of a section
 */
export function calculateSectionDepth(section: Section): number {
  if (!section.sections || section.sections.length === 0) {
    return section.depth || 0;
  }

  const maxChildDepth = Math.max(...section.sections.map((child) => calculateSectionDepth(child)));

  return (section.depth || 0) + maxChildDepth + 1;
}

/**
 * Check if a section is already nested somewhere
 */
function isSectionAlreadyNested(sectionToCheck: Section, allSections: Section[]): boolean {
  for (const section of allSections) {
    if (containsSection(section, sectionToCheck.id)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if a section contains another section (recursively)
 */
function containsSection(section: Section, sectionId: string): boolean {
  if (!section.sections) {
    return false;
  }

  for (const childSection of section.sections) {
    if (childSection.id === sectionId) {
      return true;
    }
    if (containsSection(childSection, sectionId)) {
      return true;
    }
  }

  return false;
}

/**
 * Get the full path of section names for breadcrumb display
 */
export function getSectionPath(sectionId: string, allSections: Section[], currentPath: string[] = []): string[] {
  for (const section of allSections) {
    if (section.id === sectionId) {
      return [...currentPath, section.name];
    }

    if (section.sections) {
      const path = getSectionPath(sectionId, section.sections, [...currentPath, section.name]);
      if (path.length > currentPath.length) {
        return path;
      }
    }
  }

  return currentPath;
}

/**
 * Flatten a nested section structure for easier processing
 */
export function flattenSections(sections: Section[]): Section[] {
  const flattened: Section[] = [];

  function addSection(section: Section) {
    flattened.push(section);
    if (section.sections) {
      section.sections.forEach(addSection);
    }
  }

  sections.forEach(addSection);
  return flattened;
}



export interface Field {
  id: string;
  name: string;
  type: string; // Should be a string that matches FieldType.value
  required?: boolean;
  defaultValue?: string;
  validation?: string;
  order?: number;
}

export interface Section {
  id: string;
  name: string;
  description?: string;
  order?: number;
  fields: Field[];
  sections?: Section[]; // Nested sections
  parentSectionId?: string; // Track parent for loop prevention
  depth?: number; // Track nesting depth
}

export interface SupabaseSection {
  id: string;
  page_id: string;
  name: string;
  description?: string;
  parent_section_id?: string; // For nested sections
  depth?: number; // Track nesting depth
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseField {
  id: string;
  section_id: string;
  name: string;
  type: string; // Should be a string that matches FieldType.value
  required?: boolean;
  default_value?: string;
  validation?: string;
  order: number;
  created_at?: string;
  updated_at?: string;
}

export type PageStatus = "draft" | "active" | "archived";

export interface Page {
  id: string;
  website_id: string;
  name: string;
  description?: string;
  slug: string;
  status: PageStatus;
  sections: Section[];
  created_at?: string;
  updated_at?: string;
}

export interface SupabasePage {
  id: string;
  website_id: string;
  name: string;
  description?: string;
  slug: string;
  status: PageStatus;
  created_at?: string;
  updated_at?: string;
}

export interface Website {
  id: string;
  tenant_id: string;
  name: string;
  domain: string;
  description?: string;
  status: 'active' | 'inactive' | 'maintenance';
  pages: Page[];
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseWebsite {
  id: string;
  tenant_id: string;
  name: string;
  domain: string;
  description?: string;
  status: 'active' | 'inactive' | 'maintenance';
  created_at?: string;
  updated_at?: string;
}

export interface PageStore {
  pages: Page[];
  currentPage: Page | null;
  
  // Page management
  addPage: (page: Omit<Page, 'id' | 'sections'>) => void;
  updatePage: (id: string, data: Partial<Page>) => void;
  removePage: (id: string) => void;
  setCurrentPage: (page: Page | null) => void;
  
  // Page status management
  activatePage: (id: string) => void;
  archivePage: (id: string) => void;
  setPageStatus: (id: string, status: PageStatus) => void;
  
  // Schema management per page
  updatePageSchema: (pageId: string, sections: Section[]) => void;
  getPageSchema: (pageId: string) => Section[];
  
  // Import/Export
  exportPage: (pageId: string) => Page | null;
  importPage: (page: Page) => void;
  
  // Website filtering
  getPagesByWebsite: (websiteId: string) => Page[];
}

export interface WebsiteStore {
  websites: Website[];
  currentWebsite: Website | null;
  
  // Website management
  addWebsite: (website: Omit<Website, 'id' | 'pages'>) => void;
  updateWebsite: (id: string, data: Partial<Website>) => void;
  removeWebsite: (id: string) => void;
  setCurrentWebsite: (website: Website | null) => void;
  
  // Website status management
  setWebsiteStatus: (id: string, status: Website['status']) => void;
  
  // Get websites by tenant
  getWebsitesByTenant: (tenantId: string) => Website[];
} 


export interface FieldType<C = any> {
  value: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  cmsComponent?: React.ComponentType<C>;
}


export type SupabasePageWithRelations = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  website_id: string;
  created_at: string;
  updated_at: string;
  cms_websites: {
    id: string;
    name: string;
    domain: string;
  };
  cms_sections: {
    id: string;
    name: string;
    description: string | null;
    page_id: string;
    order: number;
    cms_fields: {
      id: string;
      name: string;
      type: string;
      required: boolean;
      section_id: string;
      default_value: string | null;
      validation: string | null;
      order: number;
    }[];
  }[];
}


export type SupabaseSectionWithRelations = {
  id: string;
  name: string;
  description: string | null;
  page_id: string;
  order: number;
  cms_fields: SupabaseField[];
}

export interface CMSStore {
  sections: Section[];

  // Section management
  addSection: (name: string, description?: string) => void;
  updateSection: (id: string, data: Partial<Section>) => void;
  removeSection: (id: string) => void;

  // Field management
  addField: (sectionId: string, field: Omit<Field, 'id'>) => void;
  updateField: (sectionId: string, fieldId: string, data: Partial<Field>) => void;
  removeField: (sectionId: string, fieldId: string) => void;
  reorderFields: (sectionId: string, newFields: Field[]) => void;

  // Nested section management
  addNestedSection: (parentSectionId: string, childSectionId: string) => void;
  removeNestedSection: (parentSectionId: string, childSectionId: string) => void;

  // Schema management
  loadSchema: (sections: Section[]) => void;
  exportSchema: () => Section[];

  // Utility methods for nested sections
  getSectionById: (id: string) => Section | null;
  getAllSections: () => Section[];
  getAvailableParentSections: (sectionId: string) => Section[];
}
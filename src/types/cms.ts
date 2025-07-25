export type FieldType = 
  | "text" 
  | "number" 
  | "boolean" 
  | "date" 
  | "richtext" 
  | "image" 
  | "reference";

export interface Field {
  id: string;
  name: string;
  type: FieldType;
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
}

export interface SupabaseSection {
  id: string;
  page_id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseField {
  id: string;
  section_id: string;
  name: string;
  type: FieldType;
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
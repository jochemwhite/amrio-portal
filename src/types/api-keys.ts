import { Database } from "./supabase";

// Base API Key types from database
export type ApiKeyRow = Database["public"]["Tables"]["api_keys"]["Row"];
export type ApiKeyInsert = Database["public"]["Tables"]["api_keys"]["Insert"];
export type ApiKeyUpdate = Database["public"]["Tables"]["api_keys"]["Update"];

// Scope types
export type ApiKeyScope = "read" | "write";

// Environment types
export type ApiKeyEnvironment = "live" | "test";

// API Key with relationships
export interface ApiKey extends ApiKeyRow {
  cms_websites?: {
    id: string;
    name: string;
    domain: string;
  };
  users?: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
}

// API Key with computed fields
export interface ApiKeyWithStatus extends ApiKey {
  status: "active" | "revoked" | "expired";
  environment: ApiKeyEnvironment;
  maskedKey: string;
}

// Form data for creating an API key
export interface CreateApiKeyFormData {
  name: string;
  environment: ApiKeyEnvironment;
  websiteId?: string;
  scopes: ApiKeyScope[];
  rateLimit: number;
  expiresIn?: "never" | "30d" | "90d" | "1y" | "2y" | "custom";
  customExpiryDate?: Date;
  metadata?: {
    description?: string;
    allowedOrigins?: string[];
    allowedIps?: string[];
  };
}

// Response from generate_api_key function
export interface GeneratedApiKey {
  key: string;
  key_id: string;
  key_prefix: string;
  key_hash: string;
}

// Filters for API keys list
export interface ApiKeyFilters {
  status?: "all" | "active" | "revoked" | "expired";
  websiteId?: string;
  search?: string;
}


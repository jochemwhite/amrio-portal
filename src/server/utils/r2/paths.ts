export function media(tenantId: string, websiteId: string, filename: string): string {
  return `tenants/${tenantId}/websites/${websiteId}/media/${filename}`;
}

export function page(
  tenantId: string,
  websiteId: string,
  pageId: string,
  filename: string
): string {
  return `tenants/${tenantId}/websites/${websiteId}/pages/${pageId}/${filename}`;
}

export function formSubmission(
  tenantId: string,
  formId: string,
  submissionId: string,
  filename: string
): string {
  return `tenants/${tenantId}/forms/${formId}/submissions/${submissionId}/${filename}`;
}

export function temp(tenantId: string, filename: string): string {
  return `temp/${tenantId}/${filename}`;
}

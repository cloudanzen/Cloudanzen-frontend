import { apiClient } from './client';

// ── Control Template types ──────────────────────────────────────────────────

export interface ControlTemplateDto {
  id: string;
  referenceCode: string;
  title: string;
  description: string;
  domain: string;
  testGuidance: string | null;
  defaultFrequency: string;
  createdAt: string;
  updatedAt: string;
  mappingCount: number;
}

export interface TemplateMappingDto {
  id: string;
  frameworkId: string;
  frameworkSlug: string;
  frameworkName: string;
  requirementCode: string;
  requirementTitle: string;
  requirementDomain: string | null;
  mappingStrength: string;
}

export interface ControlTemplateDetailDto extends Omit<ControlTemplateDto, 'mappingCount'> {
  mappings: TemplateMappingDto[];
}

export interface CreateTemplateRequest {
  referenceCode: string;
  title: string;
  description: string;
  domain: string;
  testGuidance?: string;
  defaultFrequency?: string;
}

export interface UpdateTemplateRequest {
  referenceCode?: string;
  title?: string;
  description?: string;
  domain?: string;
  testGuidance?: string;
  defaultFrequency?: string;
}

export interface AddTemplateMappingRequest {
  frameworkRequirementId: string;
  frameworkId: string;
  mappingStrength?: string;
}

// ── Test Template types ─────────────────────────────────────────────────────

export interface TestTemplateDto {
  id: string;
  controlTemplateId: string;
  controlRef: string;
  controlTitle: string;
  name: string;
  description: string;
  category: string;
  testType: string;
  frequencyDays: number;
  evidenceType: string;
  guidance: string;
  createdAt: string;
}

export interface CreateTestTemplateRequest {
  controlTemplateId: string;
  name: string;
  description: string;
  category?: string;
  testType?: string;
  frequencyDays?: number;
  evidenceType?: string;
  guidance?: string;
}

// ── Policy Template types ───────────────────────────────────────────────────

export interface PolicyTemplateDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  version: string;
  createdAt: string;
  requirementMappingCount: number;
  controlMappingCount: number;
}

export interface PolicyTemplateDetailDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  content: string;
  category: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  requirementMappings: Array<{
    id: string;
    frameworkId: string;
    frameworkSlug: string;
    frameworkName: string;
    requirementCode: string;
    requirementTitle: string;
  }>;
  controlMappings: Array<{
    id: string;
    controlTemplateId: string;
    controlRef: string;
    controlTitle: string;
  }>;
}

export interface CreatePolicyTemplateRequest {
  name: string;
  slug: string;
  description: string;
  content?: string;
  category?: string;
}

// ── Organization types ──────────────────────────────────────────────────────

export interface OrgListDto {
  id: string;
  name: string;
  createdAt: string;
  userCount: number;
  controlCount: number;
  policyCount: number;
  activeFrameworks: number;
}

export interface OrgDetailDto {
  id: string;
  name: string;
  createdAt: string;
  users: Array<{ id: string; email: string; name: string | null; role: string; createdAt: string }>;
  frameworks: Array<{ id: string; slug: string; name: string; version: string; status: string; activatedAt: string | null }>;
  allowedFrameworks: Array<{ id: string; slug: string; name: string; version: string }>;
  counts: { controls: number; policies: number; risks: number };
}

export interface CreateOrgRequest {
  organizationName: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  frameworkIds?: string[];
}

// ── Framework Admin types ─────────────────────────────────────────────────
export interface FrameworkListDto {
  id: string;
  slug: string;
  name: string;
  version: string;
  requirementCount: number;
}

export interface RequirementDto {
  id: string;
  code: string;
  title: string;
  domain: string | null;
  description: string | null;
  controlTemplateCount: number;
  testTemplateCount: number;
  policyTemplateCount: number;
}

export interface RequirementMappingsDto {
  controls: Array<{
    mappingId: string;
    id: string;
    referenceCode: string;
    title: string;
    domain: string;
    mappingStrength: string;
  }>;
  tests: Array<{
    id: string;
    name: string;
    category: string;
    testType: string;
    controlRef: string;
  }>;
  policies: Array<{
    mappingId: string;
    id: string;
    name: string;
    slug: string;
    category: string;
  }>;
}

// ── Admin API service ───────────────────────────────────────────────────────

class AdminService {
  // Templates
  async listTemplates(): Promise<{ success: boolean; data: ControlTemplateDto[] }> {
    return apiClient.get('/api/admin/templates');
  }

  async getTemplate(id: string): Promise<{ success: boolean; data: ControlTemplateDetailDto }> {
    return apiClient.get(`/api/admin/templates/${id}`);
  }

  async createTemplate(body: CreateTemplateRequest): Promise<{ success: boolean; data: ControlTemplateDto }> {
    return apiClient.post('/api/admin/templates', body);
  }

  async updateTemplate(id: string, body: UpdateTemplateRequest): Promise<{ success: boolean; data: ControlTemplateDto }> {
    return apiClient.put(`/api/admin/templates/${id}`, body);
  }

  async deleteTemplate(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/api/admin/templates/${id}`);
  }

  async addTemplateMapping(templateId: string, body: AddTemplateMappingRequest): Promise<{ success: boolean; data: { id: string } }> {
    return apiClient.post(`/api/admin/templates/${templateId}/mappings`, body);
  }

  async removeTemplateMapping(templateId: string, mappingId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/api/admin/templates/${templateId}/mappings/${mappingId}`);
  }

  // Test Templates
  async listTestTemplates(): Promise<{ success: boolean; data: TestTemplateDto[] }> {
    return apiClient.get('/api/admin/test-templates');
  }

  async getTestTemplate(id: string): Promise<{ success: boolean; data: TestTemplateDto }> {
    return apiClient.get(`/api/admin/test-templates/${id}`);
  }

  async createTestTemplate(body: CreateTestTemplateRequest): Promise<{ success: boolean; data: TestTemplateDto }> {
    return apiClient.post('/api/admin/test-templates', body);
  }

  async deleteTestTemplate(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/api/admin/test-templates/${id}`);
  }

  // Policy Templates
  async listPolicyTemplates(): Promise<{ success: boolean; data: PolicyTemplateDto[] }> {
    return apiClient.get('/api/admin/policy-templates');
  }

  async getPolicyTemplate(id: string): Promise<{ success: boolean; data: PolicyTemplateDetailDto }> {
    return apiClient.get(`/api/admin/policy-templates/${id}`);
  }

  async createPolicyTemplate(body: CreatePolicyTemplateRequest): Promise<{ success: boolean; data: PolicyTemplateDto }> {
    return apiClient.post('/api/admin/policy-templates', body);
  }

  async deletePolicyTemplate(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/api/admin/policy-templates/${id}`);
  }

  // Organizations
  async listOrganizations(): Promise<{ success: boolean; data: OrgListDto[] }> {
    return apiClient.get('/api/admin/organizations');
  }

  async getOrganization(orgId: string): Promise<{ success: boolean; data: OrgDetailDto }> {
    return apiClient.get(`/api/admin/organizations/${orgId}`);
  }

  async createOrganization(body: CreateOrgRequest): Promise<{ success: boolean; data: { organization: { id: string; name: string; createdAt: string }; admin: { id: string; email: string; name: string; role: string } } }> {
    return apiClient.post('/api/admin/organizations', body);
  }

  async updateAllowedFrameworks(orgId: string, frameworkIds: string[]): Promise<{ success: boolean; data: Array<{ id: string; slug: string; name: string; version: string }> }> {
    return apiClient.put(`/api/admin/organizations/${orgId}/allowed-frameworks`, { frameworkIds });
  }

  async deleteOrganization(orgId: string, confirmName: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/api/admin/organizations/${orgId}`, { confirmName });
  }

  // Frameworks
  async listFrameworks(): Promise<{ success: boolean; data: FrameworkListDto[] }> {
    return apiClient.get('/api/admin/frameworks');
  }

  async listRequirements(frameworkId: string): Promise<{ success: boolean; data: RequirementDto[] }> {
    return apiClient.get(`/api/admin/frameworks/${frameworkId}/requirements`);
  }

  async getRequirementMappings(frameworkId: string, requirementId: string): Promise<{ success: boolean; data: RequirementMappingsDto }> {
    return apiClient.get(`/api/admin/frameworks/${frameworkId}/requirements/${requirementId}/mappings`);
  }

  async addControlMapping(requirementId: string, controlTemplateId: string, mappingStrength?: string): Promise<{ success: boolean; data: { id: string } }> {
    return apiClient.post(`/api/admin/frameworks/requirements/${requirementId}/control-mapping`, { controlTemplateId, mappingStrength });
  }

  async removeControlMapping(mappingId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/api/admin/frameworks/control-mapping/${mappingId}`);
  }

  async addPolicyMapping(requirementId: string, policyTemplateId: string): Promise<{ success: boolean; data: { id: string } }> {
    return apiClient.post(`/api/admin/frameworks/requirements/${requirementId}/policy-mapping`, { policyTemplateId });
  }

  async removePolicyMapping(mappingId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/api/admin/frameworks/policy-mapping/${mappingId}`);
  }
}

export const adminService = new AdminService();

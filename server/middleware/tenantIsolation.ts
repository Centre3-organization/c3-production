/**
 * Tenant Isolation Middleware
 * 
 * Ensures data isolation between tenants in multi-tenant environment:
 * - Tenant context injection
 * - Query filtering by tenant
 * - Cross-tenant access prevention
 */

import { TRPCError } from '@trpc/server';

// ============================================================================
// TENANT CONTEXT
// ============================================================================

export interface TenantContext {
  tenantId: number | null;
  tenantType: 'centre3' | 'contractor' | 'client' | null;
  companyId: number | null;
}

/**
 * Extract tenant context from user
 */
export function extractTenantContext(user: {
  userType?: string | null;
  contractorCompanyId?: number | null;
  clientCompanyId?: number | null;
} | null): TenantContext {
  if (!user) {
    return { tenantId: null, tenantType: null, companyId: null };
  }
  
  switch (user.userType) {
    case 'contractor':
    case 'sub_contractor':
      return {
        tenantId: user.contractorCompanyId || null,
        tenantType: 'contractor',
        companyId: user.contractorCompanyId || null,
      };
    case 'client':
      return {
        tenantId: user.clientCompanyId || null,
        tenantType: 'client',
        companyId: user.clientCompanyId || null,
      };
    case 'centre3_employee':
    default:
      return {
        tenantId: null, // Centre3 employees can see all data
        tenantType: 'centre3',
        companyId: null,
      };
  }
}

// ============================================================================
// TENANT FILTERING
// ============================================================================

/**
 * Build tenant filter condition for queries
 */
export function buildTenantFilter(
  tenantContext: TenantContext,
  options: {
    contractorField?: string;
    clientField?: string;
    allowCentre3Full?: boolean;
  } = {}
): Record<string, number> | null {
  const {
    contractorField = 'contractorCompanyId',
    clientField = 'clientCompanyId',
    allowCentre3Full = true,
  } = options;
  
  // Centre3 employees can see all data by default
  if (tenantContext.tenantType === 'centre3' && allowCentre3Full) {
    return null; // No filter needed
  }
  
  // Contractors can only see their company's data
  if (tenantContext.tenantType === 'contractor' && tenantContext.companyId) {
    return { [contractorField]: tenantContext.companyId };
  }
  
  // Clients can only see their company's data
  if (tenantContext.tenantType === 'client' && tenantContext.companyId) {
    return { [clientField]: tenantContext.companyId };
  }
  
  // If no valid tenant context, deny access
  return { id: -1 }; // Will match nothing
}

/**
 * Verify user can access a specific resource
 */
export function canAccessResource(
  tenantContext: TenantContext,
  resource: {
    contractorCompanyId?: number | null;
    clientCompanyId?: number | null;
    createdById?: number | null;
  },
  userId?: number
): boolean {
  // Centre3 employees can access all resources
  if (tenantContext.tenantType === 'centre3') {
    return true;
  }
  
  // Contractors can only access their company's resources
  if (tenantContext.tenantType === 'contractor') {
    return resource.contractorCompanyId === tenantContext.companyId;
  }
  
  // Clients can only access their company's resources
  if (tenantContext.tenantType === 'client') {
    return resource.clientCompanyId === tenantContext.companyId;
  }
  
  // Users can always access their own resources
  if (userId && resource.createdById === userId) {
    return true;
  }
  
  return false;
}

/**
 * Require access to a resource or throw error
 */
export function requireResourceAccess(
  tenantContext: TenantContext,
  resource: {
    contractorCompanyId?: number | null;
    clientCompanyId?: number | null;
    createdById?: number | null;
  },
  userId?: number
): void {
  if (!canAccessResource(tenantContext, resource, userId)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Access denied: You do not have permission to access this resource',
    });
  }
}

// ============================================================================
// TENANT-AWARE QUERY HELPERS
// ============================================================================

/**
 * Apply tenant isolation to a list of records
 */
export function filterByTenant<T extends Record<string, unknown>>(
  records: T[],
  tenantContext: TenantContext,
  options: {
    contractorField?: keyof T;
    clientField?: keyof T;
  } = {}
): T[] {
  const {
    contractorField = 'contractorCompanyId' as keyof T,
    clientField = 'clientCompanyId' as keyof T,
  } = options;
  
  // Centre3 employees see all
  if (tenantContext.tenantType === 'centre3') {
    return records;
  }
  
  // Filter by tenant
  return records.filter(record => {
    if (tenantContext.tenantType === 'contractor') {
      return record[contractorField] === tenantContext.companyId;
    }
    if (tenantContext.tenantType === 'client') {
      return record[clientField] === tenantContext.companyId;
    }
    return false;
  });
}

/**
 * Create tenant-aware context for procedures
 */
export function createTenantContext(user: {
  id: number;
  userType?: string | null;
  contractorCompanyId?: number | null;
  clientCompanyId?: number | null;
} | null) {
  const tenant = extractTenantContext(user);
  
  return {
    ...tenant,
    isCentre3: tenant.tenantType === 'centre3',
    isContractor: tenant.tenantType === 'contractor',
    isClient: tenant.tenantType === 'client',
    buildFilter: (options?: Parameters<typeof buildTenantFilter>[1]) => 
      buildTenantFilter(tenant, options),
    canAccess: (resource: Parameters<typeof canAccessResource>[1]) => 
      canAccessResource(tenant, resource, user?.id),
    requireAccess: (resource: Parameters<typeof requireResourceAccess>[1]) => 
      requireResourceAccess(tenant, resource, user?.id),
  };
}

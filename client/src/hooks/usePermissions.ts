import { trpc } from "@/utils/trpc";
import { useAuth } from "@/utils/useAuth";
import { useMemo, useCallback } from "react";

/**
 * Hook to check user permissions across the application
 * Usage:
 *   const { hasPermission, canCreate, canRead, canUpdate, canDelete } = usePermissions('sites');
 *   if (hasPermission('sites.create')) { ... }
 *   if (canCreate) { ... }
 */
export function usePermissions(module?: string) {
  const { isAuthenticated } = useAuth();
  
  const { data: permissions, isLoading } = trpc.users.getMyPermissions.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  /**
   * Check if user has a specific permission
   * @param permissionPath - Format: "module.action" (e.g., "sites.create", "users.delete")
   */
  const hasPermission = useCallback((permissionPath: string): boolean => {
    if (!permissions) return false;
    
    const [category, action] = permissionPath.split('.');
    const categoryPerms = (permissions as any)?.[category];
    if (!categoryPerms) return false;
    
    return categoryPerms[action] === true;
  }, [permissions]);

  /**
   * Check multiple permissions at once
   * Returns true if user has ALL specified permissions
   */
  const hasAllPermissions = useCallback((permissionPaths: string[]): boolean => {
    return permissionPaths.every(path => hasPermission(path));
  }, [hasPermission]);

  /**
   * Check multiple permissions at once
   * Returns true if user has ANY of the specified permissions
   */
  const hasAnyPermission = useCallback((permissionPaths: string[]): boolean => {
    return permissionPaths.some(path => hasPermission(path));
  }, [hasPermission]);

  // Module-specific permission shortcuts
  const modulePermissions = useMemo(() => {
    if (!module) {
      return {
        canCreate: false,
        canRead: false,
        canView: false,
        canUpdate: false,
        canDelete: false,
        canExport: false,
      };
    }
    
    return {
      canCreate: hasPermission(`${module}.create`),
      canRead: hasPermission(`${module}.read`) || hasPermission(`${module}.view`),
      canView: hasPermission(`${module}.view`) || hasPermission(`${module}.read`),
      canUpdate: hasPermission(`${module}.update`),
      canDelete: hasPermission(`${module}.delete`),
      canExport: hasPermission(`${module}.export`),
    };
  }, [module, hasPermission]);

  return {
    permissions,
    isLoading,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    ...modulePermissions,
  };
}

export default usePermissions;

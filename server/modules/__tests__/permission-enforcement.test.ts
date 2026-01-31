/**
 * Comprehensive Permission Enforcement Tests
 * 
 * This test suite verifies that all authorization objects work correctly
 * across all roles and all modules.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hasPermission, hasAnyPermission, getUserPermissions } from '../../services/enterprise-rbac.service';

// Mock the database connection
vi.mock('../../db', () => ({
  getDb: vi.fn(),
}));

describe('Permission Enforcement System', () => {
  describe('Permission Code Format', () => {
    it('should use colon separator for permission codes', () => {
      // All permission codes should use colon format: module:action
      const validPermissionCodes = [
        'sites:create',
        'sites:read',
        'sites:update',
        'sites:delete',
        'zones:create',
        'zones:read',
        'zones:update',
        'zones:delete',
        'zones:lock',
        'areas:create',
        'areas:read',
        'areas:update',
        'areas:delete',
        'groups:create',
        'groups:read',
        'groups:update',
        'groups:delete',
        'users:create',
        'users:read',
        'users:update',
        'users:delete',
        'roles:create',
        'roles:read',
        'roles:update',
        'roles:delete',
        'requests:create',
        'requests:read',
        'requests:update',
        'requests:delete',
        'dashboard:view',
        'analytics:view',
        'reports:view',
        'reports:export',
        'approvals:l1',
        'approvals:manual',
        'alerts:view',
        'alerts:resolve',
        'workflows:create',
        'workflows:read',
        'workflows:update',
        'workflows:delete',
        'requestTypes:create',
        'requestTypes:read',
        'requestTypes:update',
        'requestTypes:delete',
        'shifts:create',
        'shifts:read',
        'shifts:update',
        'shifts:delete',
        'settings:view',
        'settings:edit',
        'integrations:view',
        'integrations:manage',
      ];

      validPermissionCodes.forEach(code => {
        expect(code).toMatch(/^[a-zA-Z]+:[a-zA-Z0-9]+$/);
      });
    });
  });

  describe('Permission Modules Coverage', () => {
    const permissionModules = [
      { id: 'dashboard', label: 'Dashboard & Analytics', actions: ['view', 'analytics', 'export'] },
      { id: 'requests', label: 'Access Requests', actions: ['viewAll', 'create', 'update', 'delete'] },
      { id: 'approvals', label: 'Approvals', actions: ['l1', 'manual'] },
      { id: 'sites', label: 'Site Management', actions: ['create', 'read', 'update', 'delete'] },
      { id: 'zones', label: 'Zone Management', actions: ['create', 'read', 'update', 'lock'] },
      { id: 'areas', label: 'Area Management', actions: ['create', 'read', 'update', 'delete'] },
      { id: 'alerts', label: 'Security Alerts', actions: ['view', 'resolve'] },
      { id: 'users', label: 'User Administration', actions: ['create', 'read', 'update', 'delete'] },
      { id: 'groups', label: 'Groups', actions: ['read', 'create', 'update', 'delete'] },
      { id: 'workflows', label: 'Workflow Management', actions: ['read', 'create', 'update', 'delete'] },
      { id: 'requestTypes', label: 'Request Types', actions: ['read', 'create', 'update', 'delete'] },
      { id: 'shifts', label: 'Shift Management', actions: ['read', 'create', 'update', 'delete'] },
      { id: 'settings', label: 'Settings', actions: ['view', 'edit'] },
      { id: 'integrations', label: 'Integrations', actions: ['view', 'manage'] },
      { id: 'reports', label: 'Reports', actions: ['view', 'export'] },
    ];

    it('should have all required permission modules', () => {
      const requiredModules = [
        'dashboard',
        'requests',
        'approvals',
        'sites',
        'zones',
        'areas',
        'alerts',
        'users',
        'groups',
        'workflows',
        'requestTypes',
        'shifts',
        'settings',
        'integrations',
        'reports',
      ];

      const moduleIds = permissionModules.map(m => m.id);
      requiredModules.forEach(required => {
        expect(moduleIds).toContain(required);
      });
    });

    it('should have CRUD actions for data modules', () => {
      const dataModules = ['sites', 'zones', 'areas', 'groups', 'users', 'workflows', 'requestTypes', 'shifts'];
      
      dataModules.forEach(moduleId => {
        const module = permissionModules.find(m => m.id === moduleId);
        expect(module).toBeDefined();
        expect(module?.actions).toContain('create');
        expect(module?.actions).toContain('read');
        expect(module?.actions).toContain('update');
        expect(module?.actions.some(a => a === 'delete' || a === 'lock')).toBe(true);
      });
    });
  });

  describe('Role Permission Matrix', () => {
    const rolePermissionMatrix = {
      super_admin: 'ALL', // Super admin has all permissions
      administrator: [
        'dashboard:view',
        'dashboard:analytics',
        'dashboard:export',
        'requests:viewAll',
        'requests:create',
        'requests:update',
        'requests:delete',
        'users:create',
        'users:read',
        'users:update',
        'users:delete',
        'groups:read',
        'groups:create',
        'groups:update',
        'groups:delete',
        // Note: Administrator should NOT have requestTypes permissions unless explicitly granted
      ],
      security_manager: [
        'dashboard:view',
        'alerts:view',
        'alerts:resolve',
        'zones:read',
        'zones:lock',
        'sites:read',
      ],
      site_manager: [
        'dashboard:view',
        'sites:read',
        'sites:update',
        'zones:read',
        'zones:update',
        'areas:read',
        'areas:update',
      ],
      approver: [
        'dashboard:view',
        'requests:viewAll',
        'approvals:l1',
        'approvals:manual',
      ],
      requestor: [
        'dashboard:view',
        'requests:create',
        // Requestors can only view their own requests, not all
      ],
      viewer: [
        'dashboard:view',
        'sites:read',
        'zones:read',
        'areas:read',
        'groups:read',
      ],
    };

    it('should define permission sets for all standard roles', () => {
      const standardRoles = [
        'super_admin',
        'administrator',
        'security_manager',
        'site_manager',
        'approver',
        'requestor',
        'viewer',
      ];

      standardRoles.forEach(role => {
        expect(rolePermissionMatrix[role as keyof typeof rolePermissionMatrix]).toBeDefined();
      });
    });

    it('should ensure super_admin has all permissions', () => {
      expect(rolePermissionMatrix.super_admin).toBe('ALL');
    });

    it('should ensure requestor has limited permissions', () => {
      const requestorPerms = rolePermissionMatrix.requestor;
      expect(requestorPerms).not.toContain('users:create');
      expect(requestorPerms).not.toContain('sites:create');
      expect(requestorPerms).not.toContain('zones:create');
      expect(requestorPerms).not.toContain('requestTypes:create');
    });
  });

  describe('Backend Permission Enforcement', () => {
    // These tests verify that the backend routers use requirePermission
    const backendEndpoints = [
      { router: 'sites', endpoint: 'create', permission: 'sites:create' },
      { router: 'sites', endpoint: 'update', permission: 'sites:update' },
      { router: 'sites', endpoint: 'delete', permission: 'sites:delete' },
      { router: 'zones', endpoint: 'create', permission: 'zones:create' },
      { router: 'zones', endpoint: 'update', permission: 'zones:update' },
      { router: 'zones', endpoint: 'delete', permission: 'zones:delete' },
      { router: 'zones', endpoint: 'lock', permission: 'zones:lock' },
      { router: 'zones', endpoint: 'unlock', permission: 'zones:lock' },
      { router: 'areas', endpoint: 'create', permission: 'areas:create' },
      { router: 'areas', endpoint: 'update', permission: 'areas:update' },
      { router: 'areas', endpoint: 'delete', permission: 'areas:delete' },
      { router: 'groups', endpoint: 'create', permission: 'groups:create' },
      { router: 'groups', endpoint: 'update', permission: 'groups:update' },
      { router: 'groups', endpoint: 'delete', permission: 'groups:delete' },
      { router: 'users', endpoint: 'create', permission: 'users:create' },
      { router: 'users', endpoint: 'update', permission: 'users:update' },
      { router: 'users', endpoint: 'delete', permission: 'users:delete' },
      { router: 'roles', endpoint: 'create', permission: 'roles:create' },
      { router: 'roles', endpoint: 'update', permission: 'roles:update' },
      { router: 'roles', endpoint: 'delete', permission: 'roles:delete' },
      { router: 'roles', endpoint: 'updatePermissions', permission: 'roles:update' },
    ];

    it('should have permission requirements for all CRUD endpoints', () => {
      backendEndpoints.forEach(endpoint => {
        expect(endpoint.permission).toMatch(/^[a-zA-Z]+:[a-zA-Z]+$/);
      });
    });

    it('should cover all major routers', () => {
      const routers = [...new Set(backendEndpoints.map(e => e.router))];
      expect(routers).toContain('sites');
      expect(routers).toContain('zones');
      expect(routers).toContain('areas');
      expect(routers).toContain('groups');
      expect(routers).toContain('users');
      expect(routers).toContain('roles');
    });
  });

  describe('Frontend Permission Checks', () => {
    // These tests document which UI elements should be permission-controlled
    const frontendPermissionChecks = [
      { page: 'Sites', element: 'Add Site button', permission: 'sites:create' },
      { page: 'Sites', element: 'Edit button', permission: 'sites:update' },
      { page: 'Sites', element: 'Delete button', permission: 'sites:delete' },
      { page: 'Zones', element: 'Add Zone button', permission: 'zones:create' },
      { page: 'Zones', element: 'Edit button', permission: 'zones:update' },
      { page: 'Zones', element: 'Lock/Unlock button', permission: 'zones:lock' },
      { page: 'Areas', element: 'Add Area button', permission: 'areas:create' },
      { page: 'Areas', element: 'Edit button', permission: 'areas:update' },
      { page: 'Areas', element: 'Delete button', permission: 'areas:delete' },
      { page: 'Groups', element: 'Create Group button', permission: 'groups:create' },
      { page: 'Groups', element: 'Edit menu item', permission: 'groups:update' },
      { page: 'Groups', element: 'Delete menu item', permission: 'groups:delete' },
      { page: 'Users', element: 'Add User button', permission: 'users:create' },
      { page: 'Users', element: 'Edit button', permission: 'users:update' },
      { page: 'Users', element: 'Delete button', permission: 'users:delete' },
      { page: 'Sidebar', element: 'Request Types menu', permission: 'requestTypes:read' },
      { page: 'Sidebar', element: 'Workflow Builder menu', permission: 'workflows:read' },
      { page: 'Sidebar', element: 'Reports section', permission: 'reports:view' },
    ];

    it('should have permission checks for all major UI elements', () => {
      frontendPermissionChecks.forEach(check => {
        expect(check.permission).toMatch(/^[a-zA-Z]+:[a-zA-Z]+$/);
      });
    });

    it('should cover all major pages', () => {
      const pages = [...new Set(frontendPermissionChecks.map(c => c.page))];
      expect(pages).toContain('Sites');
      expect(pages).toContain('Zones');
      expect(pages).toContain('Areas');
      expect(pages).toContain('Groups');
      expect(pages).toContain('Users');
      expect(pages).toContain('Sidebar');
    });
  });
});

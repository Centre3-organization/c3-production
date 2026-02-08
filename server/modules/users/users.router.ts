import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../../_core/trpc";
import {
  getUserById,
  listUsers,
  updateUser,
  createUser,
  deleteUser,
  getRoleById,
  getDepartmentById,
} from "../../infra/db/connection";
import bcrypt from "bcryptjs";
import { getUserSystemRole, assignRole, assignRoleById, getAllSystemRoles, getUserPermissions } from "../../services/enterprise-rbac.service";

export const usersRouter = router({
  // Yakeen verification endpoint (mock implementation)
  verifyByYakeen: protectedProcedure
    .input(
      z.object({
        idType: z.enum(["national_id", "iqama"]),
        idNumber: z.string().min(10, "ID number must be at least 10 digits"),
        dateOfBirth: z.string().optional(), // Format: YYYY-MM-DD
      })
    )
    .mutation(async ({ input }) => {
      // Mock Yakeen verification - in production, this would call the actual Yakeen API
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful verification for demo purposes
      // In production, this would validate against Yakeen's SOAP/REST API
      const mockData: Record<string, {
        firstName: string;
        lastName: string;
        firstNameAr: string;
        lastNameAr: string;
        dateOfBirth: string;
        nationality: string;
        gender: string;
      }> = {
        // Sample mock data for testing
        "1234567890": {
          firstName: "Mohammed",
          lastName: "Al-Rashid",
          firstNameAr: "محمد",
          lastNameAr: "الراشد",
          dateOfBirth: "1985-03-15",
          nationality: "Saudi",
          gender: "Male",
        },
        "2345678901": {
          firstName: "Ahmed",
          lastName: "Al-Fahad",
          firstNameAr: "أحمد",
          lastNameAr: "الفهد",
          dateOfBirth: "1990-07-22",
          nationality: "Saudi",
          gender: "Male",
        },
        "3456789012": {
          firstName: "Fatima",
          lastName: "Al-Salem",
          firstNameAr: "فاطمة",
          lastNameAr: "السالم",
          dateOfBirth: "1988-11-08",
          nationality: "Saudi",
          gender: "Female",
        },
      };
      
      const userData = mockData[input.idNumber];
      
      if (userData) {
        return {
          success: true,
          verified: true,
          data: {
            ...userData,
            idType: input.idType,
            idNumber: input.idNumber,
          },
        };
      }
      
      // For any other ID, return not found (user can enter manually)
      return {
        success: true,
        verified: false,
        message: "ID not found in Yakeen database. Please enter information manually.",
      };
    }),

  // Get current authenticated user
  me: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new Error("Not authenticated");
    }
    
    // Get user's system role
    const systemRole = await getUserSystemRole(ctx.user.id);
    
    return {
      ...ctx.user,
      systemRole: systemRole ? {
        id: systemRole.id,
        code: systemRole.code,
        name: systemRole.name,
        level: systemRole.level,
      } : null,
    };
  }),

  // List all users with filters
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.enum(["active", "inactive", "all"]).optional(),
        role: z.enum(["user", "admin", "all"]).optional(),
        departmentId: z.number().optional(),
        groupId: z.number().optional(),
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      return listUsers(input);
    }),

  // Get user by ID with related data
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const user = await getUserById(input.id);
      if (!user) {
        throw new Error("User not found");
      }

      // Get user's system role
      const systemRole = await getUserSystemRole(input.id);

      return {
        ...user,
        systemRole: systemRole ? {
          id: systemRole.id,
          code: systemRole.code,
          name: systemRole.name,
          level: systemRole.level,
        } : null,
      };
    }),

  // Create a new user (admin only)
  create: requirePermission("users:create")
    .input(
      z.object({
        // Step 1: User Type
        userType: z.enum(["centre3_employee", "contractor", "sub_contractor", "client"]),
        
        // Step 2: Personal Details (all user types)
        firstName: z.string().min(1, "First name is required"),
        lastName: z.string().min(1, "Last name is required"),
        email: z.string().email("Invalid email address"),
        phone: z.string().min(1, "Mobile number is required"),
        jobTitle: z.string().min(1, "Job title is required"),
        
        // Centre3 Employee specific fields
        employeeId: z.string().optional(),
        departmentId: z.number().nullable().optional(),
        managerId: z.number().nullable().optional(),
        
        // Contractor specific fields
        contractorCompanyId: z.number().nullable().optional(),
        contractReference: z.string().optional(),
        contractExpiry: z.string().optional(), // ISO date string
        reportingToId: z.number().nullable().optional(),
        
        // Sub-Contractor specific fields
        parentContractorId: z.number().nullable().optional(),
        subContractorCompany: z.string().optional(),
        
        // Client specific fields
        clientCompanyId: z.number().nullable().optional(),
        accountManagerId: z.number().nullable().optional(),
        
        // Step 3: System Access
        role: z.enum(["user", "admin"]).default("user"),
        systemRoleId: z.number().optional(), // New enterprise RBAC role
        siteIds: z.array(z.number()).optional(),
        
        // Step 4: Photo
        profilePhotoUrl: z.string().optional(),
        
        // Step 5: Options
        temporaryPassword: z.string().min(6, "Password must be at least 6 characters"),
        sendWelcomeEmail: z.boolean().default(true),
        mustChangePassword: z.boolean().default(true),
        accountExpiresWithContract: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      // Validate Centre3 employee email domain
      if (input.userType === "centre3_employee" && !input.email.endsWith("@center3.sa")) {
        // Allow for now, but could enforce: throw new Error("Centre3 employees must use @center3.sa email");
      }
      
      // Hash the temporary password
      const passwordHash = await bcrypt.hash(input.temporaryPassword, 10);
      
      // Create full name from first and last name
      const fullName = `${input.firstName} ${input.lastName}`.trim();
      
      const userId = await createUser({
        firstName: input.firstName,
        lastName: input.lastName,
        name: fullName,
        email: input.email,
        phone: input.phone || null,
        passwordHash: passwordHash,
        role: input.role,
        departmentId: input.departmentId || null,
        // New fields
        userType: input.userType,
        employeeId: input.employeeId || null,
        jobTitle: input.jobTitle || null,
        contractorCompanyId: input.contractorCompanyId || null,
        parentContractorId: input.parentContractorId || null,
        subContractorCompany: input.subContractorCompany || null,
        clientCompanyId: input.clientCompanyId || null,
        contractReference: input.contractReference || null,
        contractExpiry: input.contractExpiry ? new Date(input.contractExpiry) : null,
        reportingToId: input.reportingToId || null,
        accountManagerId: input.accountManagerId || null,
        profilePhotoUrl: input.profilePhotoUrl || null,
        managerId: input.managerId || null,
      });
      
      // Assign system role if provided
      if (input.systemRoleId) {
        try {
          await assignRoleById(userId, input.systemRoleId, userId); // Self-assigned during creation
        } catch (err) {
          console.error('Failed to assign system role:', err);
          // Don't fail user creation if role assignment fails
        }
      } else {
        // Default to 'requestor' role (id: 8) if no role specified
        try {
          await assignRoleById(userId, 8, userId);
        } catch (err) {
          console.error('Failed to assign default role:', err);
        }
      }
      
      // TODO: Handle site assignments if siteIds provided
      // TODO: Send welcome email if sendWelcomeEmail is true
      
      return { success: true, userId };
    }),

  // Update user profile (admin only for most fields)
  update: requirePermission("users:update")
    .input(
      z.object({
        id: z.number(),
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        roleId: z.number().nullable().optional(),
        status: z.enum(["active", "inactive", "suspended"]).optional(),
        departmentId: z.number().nullable().optional(),
        jobTitle: z.string().optional(),
        employeeId: z.string().optional(),
        managerId: z.number().nullable().optional(),
        contractorCompanyId: z.number().nullable().optional(),
        contractReference: z.string().optional(),
        contractExpiry: z.string().optional(),
        reportingToId: z.number().nullable().optional(),
        clientCompanyId: z.number().nullable().optional(),
        accountManagerId: z.number().nullable().optional(),
        accountExpiresWithContract: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, firstName, lastName, contractExpiry, ...data } = input;
      
      // Update full name if first or last name changed
      const updateData: any = { ...data };
      if (firstName !== undefined || lastName !== undefined) {
        const user = await getUserById(id);
        if (user) {
          const newFirstName = firstName ?? user.firstName ?? '';
          const newLastName = lastName ?? user.lastName ?? '';
          updateData.firstName = newFirstName;
          updateData.lastName = newLastName;
          updateData.name = `${newFirstName} ${newLastName}`.trim();
        }
      }
      
      // Convert contract expiry string to Date if provided
      if (contractExpiry) {
        updateData.contractExpiry = new Date(contractExpiry);
      }
      
      // Only update if there's data to update
      if (Object.keys(updateData).length > 0) {
        await updateUser(id, updateData);
      }
      return { success: true };
    }),

  // Delete user (admin only)
  delete: requirePermission("users:delete")
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteUser(input.id);
      return { success: true };
    }),

  // Update own profile (limited fields)
  updateProfile: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new Error("Not authenticated");
      }
      
      const updateData: any = { ...input };
      if (input.firstName !== undefined || input.lastName !== undefined) {
        const newFirstName = input.firstName ?? ctx.user.firstName ?? '';
        const newLastName = input.lastName ?? ctx.user.lastName ?? '';
        updateData.name = `${newFirstName} ${newLastName}`.trim();
      }
      
      await updateUser(ctx.user.id, updateData);
      return { success: true };
    }),

  // Change user password (admin only)
  changePassword: requirePermission("users:update")
    .input(
      z.object({
        userId: z.number(),
        newPassword: z.string().min(6, "Password must be at least 6 characters"),
      })
    )
    .mutation(async ({ input }) => {
      const passwordHash = await bcrypt.hash(input.newPassword, 10);
      await updateUser(input.userId, { passwordHash });
      return { success: true };
    }),

  // Activate user (admin only)
  activate: requirePermission("users:update")
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await updateUser(input.id, { status: "active" } as any);
      return { success: true };
    }),

  // Deactivate user (admin only)
  deactivate: requirePermission("users:update")
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await updateUser(input.id, { status: "inactive" } as any);
      return { success: true };
    }),

  // Assign system role to a user
  assignRole: requirePermission("users:update")
    .input(
      z.object({
        userId: z.number(),
        roleCode: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new Error("Not authenticated");
      }

      const success = await assignRole(input.userId, input.roleCode, ctx.user.id);
      if (!success) {
        throw new Error("Failed to assign role. Role may not exist.");
      }

      return { success: true };
    }),

  // Get all available system roles
  getSystemRoles: protectedProcedure.query(async () => {
    return getAllSystemRoles();
  }),

  // Get current user's permissions based on their system role
  getMyPermissions: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      return null;
    }

    // Get user's permissions from enterprise RBAC
    const userPerms = await getUserPermissions(ctx.user.id);
    
    // Convert permission set to the expected format - includes all modules
    const permissionsByCategory: Record<string, Record<string, boolean>> = {
      // Dashboard & Analytics
      dashboard: { view: false, analytics: false, export: false },
      // Access Requests
      requests: { view: false, create: false, update: false, delete: false, approve: false, reject: false },
      // Approvals
      approvals: { l1: false, manual: false },
      // Site Management
      sites: { create: false, read: false, update: false, delete: false },
      // Zone Management
      zones: { create: false, read: false, update: false, lock: false },
      // Security Alerts
      alerts: { view: false, resolve: false },
      // User Administration
      users: { view: false, create: false, read: false, update: false, delete: false, manage_roles: false },
      // Groups
      groups: { view: false, create: false, update: false, delete: false },
      // Workflow Management
      workflows: { view: false, create: false, update: false, delete: false },
      // Request Types
      requestTypes: { view: false, create: false, update: false, delete: false },
      // Delegations
      delegations: { view: false, create: false, update: false, delete: false },
      // Card Management
      cards: { view: false, issue: false, revoke: false, control: false },
      // Hardware
      hardware: { view: false, control: false },
      // Reports
      reports: { view: false, export: false },
      // Settings
      settings: { view: false, update: false },
      // Integration Hub
      integrations: { view: false, configure: false },
      // Admin
      admin: { access: false, roles: false, audit: false, full: false },
      // Legacy compatibility
      facilities: { view: false, create: false, update: false },
    };

    if (userPerms) {
      // Parse permissions from the set (format: "module:action")
      for (const perm of Array.from(userPerms.permissions)) {
        const [module, action] = perm.split(':');
        if (module && action && permissionsByCategory[module]) {
          permissionsByCategory[module][action] = true;
        }
      }

      // Only super_admin has all permissions automatically
      // Admin and other roles use their actual assigned permissions
      if (userPerms.roleCode === 'super_admin') {
        for (const category of Object.keys(permissionsByCategory)) {
          for (const action of Object.keys(permissionsByCategory[category])) {
            permissionsByCategory[category][action] = true;
          }
        }
      }
    } else {
      // Fallback for users without a system role - minimal Requestor permissions
      permissionsByCategory.dashboard.view = true;
      permissionsByCategory.requests.view = true;
      permissionsByCategory.requests.create = true;
      permissionsByCategory.requests.update = true;
    }

    return permissionsByCategory;
  }),
});

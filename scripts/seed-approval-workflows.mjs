/**
 * Seed Script: Configure Approval Workflows
 * 
 * This script creates the approval workflows for the 20 test cases:
 * 1. Standard Admin Visit Workflow
 * 2. Riyadh Site Workflow
 * 3. External Company Workflow
 * 4. VIP Workflow
 * 5. Emergency Workflow
 * 6. Jabor Site Workflow
 * 7. Facility Inspection Workflow
 * 8. Weekend Workflow
 */

import mysql from 'mysql2/promise';

// Database connection from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

// Parse connection string
function parseConnectionString(url) {
  const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
  if (!match) throw new Error('Invalid DATABASE_URL format');
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4]),
    database: match[5],
    ssl: { rejectUnauthorized: true }
  };
}

async function main() {
  const config = parseConnectionString(DATABASE_URL);
  const connection = await mysql.createConnection(config);
  
  console.log('Connected to database');
  
  try {
    // Get user IDs for approvers
    const getUserId = async (email) => {
      const [rows] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
      return rows.length > 0 ? rows[0].id : null;
    };
    
    // Get site ID
    const getSiteId = async (code) => {
      const [rows] = await connection.execute('SELECT id FROM sites WHERE code = ?', [code]);
      return rows.length > 0 ? rows[0].id : null;
    };
    
    // Get approval role ID
    const getApprovalRoleId = async (code) => {
      const [rows] = await connection.execute('SELECT id FROM approvalRoles WHERE code = ?', [code]);
      return rows.length > 0 ? rows[0].id : null;
    };
    
    // Get user IDs
    const securityOfficerId = await getUserId('securityofficer@centre3.com');
    const siteManagerId = await getUserId('sitemanager@centre3.com');
    const securityManagerId = await getUserId('securitymanager@centre3.com');
    const riyadhSecurityOfficerId = await getUserId('riyadhsecurityofficer@centre3.com');
    const jaborOfficerId = await getUserId('jaborofficer@centre3.com');
    const facilityManagerId = await getUserId('facilitymanager@centre3.com');
    const accessControllerId = await getUserId('accesscontroller@centre3.com');
    const shiftLeadId = await getUserId('shiftlead@centre3.com');
    const dutyManagerId = await getUserId('dutymanager@centre3.com');
    const operationsManagerId = await getUserId('operationsmanager@centre3.com');
    const awsManagerId = await getUserId('manager@aws.com');
    const googleManagerId = await getUserId('manager@google.com');
    
    // Get site IDs
    const riyadhSiteId = await getSiteId('RDC46');
    const jaborSiteId = await getSiteId('JDC04');
    
    console.log('User IDs retrieved:');
    console.log(`  Security Officer: ${securityOfficerId}`);
    console.log(`  Site Manager: ${siteManagerId}`);
    console.log(`  Security Manager: ${securityManagerId}`);
    console.log(`  Riyadh Security Officer: ${riyadhSecurityOfficerId}`);
    console.log(`  Jabor Officer: ${jaborOfficerId}`);
    console.log(`  Facility Manager: ${facilityManagerId}`);
    console.log(`  Duty Manager: ${dutyManagerId}`);
    console.log(`  Operations Manager: ${operationsManagerId}`);
    console.log(`  AWS Manager: ${awsManagerId}`);
    console.log(`  Google Manager: ${googleManagerId}`);
    console.log(`  Riyadh Site ID: ${riyadhSiteId}`);
    console.log(`  Jabor Site ID: ${jaborSiteId}`);
    
    // Helper to create workflow
    const createWorkflow = async (name, description, processType, priority, isDefault) => {
      // Check if workflow already exists
      const [existing] = await connection.execute('SELECT id FROM approvalWorkflows WHERE name = ?', [name]);
      if (existing.length > 0) {
        console.log(`  Workflow "${name}" already exists (ID: ${existing[0].id})`);
        return existing[0].id;
      }
      
      const [result] = await connection.execute(
        `INSERT INTO approvalWorkflows (name, description, processType, priority, isDefault, isActive, version) 
         VALUES (?, ?, ?, ?, ?, true, 1)`,
        [name, description, processType, priority, isDefault]
      );
      console.log(`  Created workflow: ${name} (ID: ${result.insertId})`);
      return result.insertId;
    };
    
    // Helper to add stage
    const addStage = async (workflowId, stageOrder, stageName, stageType, slaHours = 24) => {
      const [result] = await connection.execute(
        `INSERT INTO approvalStages (workflowId, stageOrder, stageName, stageType, approvalMode, requiredApprovals, canReject, canRequestInfo, slaHours) 
         VALUES (?, ?, ?, ?, 'any', 1, true, true, ?)`,
        [workflowId, stageOrder, stageName, stageType, slaHours]
      );
      return result.insertId;
    };
    
    // Helper to add approver to stage
    const addApprover = async (stageId, approverType, approverReference, priority = 0) => {
      await connection.execute(
        `INSERT INTO stageApprovers (stageId, approverType, approverReference, priority, isBackup) 
         VALUES (?, ?, ?, ?, false)`,
        [stageId, approverType, String(approverReference), priority]
      );
    };
    
    // Helper to add condition
    const addCondition = async (workflowId, conditionType, conditionOperator, conditionValue) => {
      await connection.execute(
        `INSERT INTO workflowConditions (workflowId, conditionType, conditionOperator, conditionValue, logicalGroup) 
         VALUES (?, ?, ?, ?, 0)`,
        [workflowId, conditionType, conditionOperator, JSON.stringify(conditionValue)]
      );
    };
    
    // ============================================
    // WORKFLOW 1: Standard Admin Visit
    // ============================================
    console.log('\n--- Creating Workflow 1: Standard Admin Visit ---');
    const workflow1Id = await createWorkflow(
      'Standard Admin Visit Workflow',
      'Default 3-level approval for admin visits: Security Officer → Site Manager → Security Manager',
      'admin_visit',
      10,
      true
    );
    
    if (workflow1Id) {
      // Check if stages already exist
      const [existingStages] = await connection.execute('SELECT id FROM approvalStages WHERE workflowId = ?', [workflow1Id]);
      if (existingStages.length === 0) {
        const stage1 = await addStage(workflow1Id, 1, 'Security Officer Review', 'individual', 8);
        await addApprover(stage1, 'user', securityOfficerId);
        
        const stage2 = await addStage(workflow1Id, 2, 'Site Manager Approval', 'individual', 24);
        await addApprover(stage2, 'user', siteManagerId);
        
        const stage3 = await addStage(workflow1Id, 3, 'Security Manager Final Approval', 'individual', 24);
        await addApprover(stage3, 'user', securityManagerId);
        
        console.log('  Added 3 stages with approvers');
      }
    }
    
    // ============================================
    // WORKFLOW 2: Riyadh Site Workflow
    // ============================================
    console.log('\n--- Creating Workflow 2: Riyadh Site Workflow ---');
    const workflow2Id = await createWorkflow(
      'Riyadh Site Admin Visit',
      'Site-specific workflow for Riyadh (RDC46): Riyadh Security Officer → Security Manager',
      'admin_visit',
      20,
      false
    );
    
    if (workflow2Id) {
      const [existingStages] = await connection.execute('SELECT id FROM approvalStages WHERE workflowId = ?', [workflow2Id]);
      if (existingStages.length === 0) {
        // Add site condition
        await addCondition(workflow2Id, 'site_id', 'equals', riyadhSiteId);
        
        const stage1 = await addStage(workflow2Id, 1, 'Riyadh Security Officer Review', 'individual', 8);
        await addApprover(stage1, 'user', riyadhSecurityOfficerId);
        
        const stage2 = await addStage(workflow2Id, 2, 'Security Manager Final Approval', 'individual', 24);
        await addApprover(stage2, 'user', securityManagerId);
        
        console.log('  Added 2 stages with site condition');
      }
    }
    
    // ============================================
    // WORKFLOW 3: External Company Workflow
    // ============================================
    console.log('\n--- Creating Workflow 3: External Company Workflow ---');
    const workflow3Id = await createWorkflow(
      'External Company Admin Visit',
      'Workflow for external company requests: External Manager → Site Manager → Security Manager',
      'admin_visit',
      15,
      false
    );
    
    if (workflow3Id) {
      const [existingStages] = await connection.execute('SELECT id FROM approvalStages WHERE workflowId = ?', [workflow3Id]);
      if (existingStages.length === 0) {
        // Add requester type condition
        await addCondition(workflow3Id, 'requester_type', 'equals', 'client');
        
        const stage1 = await addStage(workflow3Id, 1, 'External Company Manager Approval', 'external_manager', 24);
        // External manager is dynamic based on requester's company
        
        const stage2 = await addStage(workflow3Id, 2, 'Site Manager Approval', 'individual', 24);
        await addApprover(stage2, 'user', siteManagerId);
        
        const stage3 = await addStage(workflow3Id, 3, 'Security Manager Final Approval', 'individual', 24);
        await addApprover(stage3, 'user', securityManagerId);
        
        console.log('  Added 3 stages with requester type condition');
      }
    }
    
    // ============================================
    // WORKFLOW 4: VIP Workflow
    // ============================================
    console.log('\n--- Creating Workflow 4: VIP Workflow ---');
    const workflow4Id = await createWorkflow(
      'VIP Admin Visit',
      'Expedited workflow for VIP visitors: Security Manager → Operations Manager',
      'admin_visit',
      25,
      false
    );
    
    if (workflow4Id) {
      const [existingStages] = await connection.execute('SELECT id FROM approvalStages WHERE workflowId = ?', [workflow4Id]);
      if (existingStages.length === 0) {
        // Add VIP condition
        await addCondition(workflow4Id, 'vip_visit', 'equals', true);
        
        const stage1 = await addStage(workflow4Id, 1, 'Security Manager Review', 'individual', 4);
        await addApprover(stage1, 'user', securityManagerId);
        
        const stage2 = await addStage(workflow4Id, 2, 'Operations Manager Final Approval', 'individual', 4);
        await addApprover(stage2, 'user', operationsManagerId);
        
        console.log('  Added 2 stages with VIP condition');
      }
    }
    
    // ============================================
    // WORKFLOW 5: Emergency Workflow
    // ============================================
    console.log('\n--- Creating Workflow 5: Emergency Workflow ---');
    const workflow5Id = await createWorkflow(
      'Emergency Access Workflow',
      'After-hours emergency access: Duty Manager → Security Manager',
      'admin_visit',
      30,
      false
    );
    
    if (workflow5Id) {
      const [existingStages] = await connection.execute('SELECT id FROM approvalStages WHERE workflowId = ?', [workflow5Id]);
      if (existingStages.length === 0) {
        // Add working hours condition
        await addCondition(workflow5Id, 'working_hours', 'equals', false);
        
        const stage1 = await addStage(workflow5Id, 1, 'Duty Manager On-Call Approval', 'individual', 2);
        await addApprover(stage1, 'user', dutyManagerId);
        
        const stage2 = await addStage(workflow5Id, 2, 'Security Manager Emergency Authorization', 'individual', 2);
        await addApprover(stage2, 'user', securityManagerId);
        
        console.log('  Added 2 stages with working hours condition');
      }
    }
    
    // ============================================
    // WORKFLOW 6: Jabor Site Workflow
    // ============================================
    console.log('\n--- Creating Workflow 6: Jabor Site Workflow ---');
    const workflow6Id = await createWorkflow(
      'Jabor Site Admin Visit',
      'Site-specific workflow for Jabor (JDC04): Jabor Officer → Site Manager → Security Manager',
      'admin_visit',
      20,
      false
    );
    
    if (workflow6Id) {
      const [existingStages] = await connection.execute('SELECT id FROM approvalStages WHERE workflowId = ?', [workflow6Id]);
      if (existingStages.length === 0) {
        // Add site condition
        await addCondition(workflow6Id, 'site_id', 'equals', jaborSiteId);
        
        const stage1 = await addStage(workflow6Id, 1, 'Jabor Security Officer Review', 'individual', 8);
        await addApprover(stage1, 'user', jaborOfficerId);
        
        const stage2 = await addStage(workflow6Id, 2, 'Site Manager Approval', 'individual', 24);
        await addApprover(stage2, 'user', siteManagerId);
        
        const stage3 = await addStage(workflow6Id, 3, 'Security Manager Final Approval', 'individual', 24);
        await addApprover(stage3, 'user', securityManagerId);
        
        console.log('  Added 3 stages with site condition');
      }
    }
    
    // ============================================
    // WORKFLOW 7: Facility Inspection Workflow
    // ============================================
    console.log('\n--- Creating Workflow 7: Facility Inspection Workflow ---');
    const workflow7Id = await createWorkflow(
      'Facility Inspection Workflow',
      'Workflow for facility inspections: Facility Manager → Site Manager → Operations Manager',
      'admin_visit',
      15,
      false
    );
    
    if (workflow7Id) {
      const [existingStages] = await connection.execute('SELECT id FROM approvalStages WHERE workflowId = ?', [workflow7Id]);
      if (existingStages.length === 0) {
        // Add category condition
        await addCondition(workflow7Id, 'category', 'equals', 'facility_inspection');
        
        const stage1 = await addStage(workflow7Id, 1, 'Facility Manager Review', 'individual', 24);
        await addApprover(stage1, 'user', facilityManagerId);
        
        const stage2 = await addStage(workflow7Id, 2, 'Site Manager Approval', 'individual', 24);
        await addApprover(stage2, 'user', siteManagerId);
        
        const stage3 = await addStage(workflow7Id, 3, 'Operations Manager Final Approval', 'individual', 24);
        await addApprover(stage3, 'user', operationsManagerId);
        
        console.log('  Added 3 stages with category condition');
      }
    }
    
    // ============================================
    // WORKFLOW 8: Weekend Workflow
    // ============================================
    console.log('\n--- Creating Workflow 8: Weekend Workflow ---');
    const workflow8Id = await createWorkflow(
      'Weekend Access Workflow',
      'Weekend access requests: Duty Manager → Security Manager',
      'admin_visit',
      18,
      false
    );
    
    if (workflow8Id) {
      const [existingStages] = await connection.execute('SELECT id FROM approvalStages WHERE workflowId = ?', [workflow8Id]);
      if (existingStages.length === 0) {
        // Add day of week condition (Friday=5, Saturday=6 in Saudi Arabia)
        await addCondition(workflow8Id, 'day_of_week', 'in', [5, 6]);
        
        const stage1 = await addStage(workflow8Id, 1, 'Duty Manager Weekend Approval', 'individual', 4);
        await addApprover(stage1, 'user', dutyManagerId);
        
        const stage2 = await addStage(workflow8Id, 2, 'Security Manager Final Approval', 'individual', 8);
        await addApprover(stage2, 'user', securityManagerId);
        
        console.log('  Added 2 stages with day of week condition');
      }
    }
    
    // ============================================
    // Assign User Approval Roles
    // ============================================
    console.log('\n--- Assigning User Approval Roles ---');
    
    const approvalRoles = [
      { userId: securityOfficerId, roleCode: 'SECURITY_OFFICER' },
      { userId: siteManagerId, roleCode: 'SITE_MANAGER' },
      { userId: securityManagerId, roleCode: 'SECURITY_MANAGER' },
      { userId: riyadhSecurityOfficerId, roleCode: 'SECURITY_OFFICER' },
      { userId: jaborOfficerId, roleCode: 'SECURITY_OFFICER' },
      { userId: facilityManagerId, roleCode: 'FACILITY_MANAGER' },
      { userId: operationsManagerId, roleCode: 'OPERATIONS_MANAGER' },
      { userId: awsManagerId, roleCode: 'EXTERNAL_MANAGER' },
      { userId: googleManagerId, roleCode: 'EXTERNAL_MANAGER' },
    ];
    
    for (const assignment of approvalRoles) {
      if (!assignment.userId) continue;
      
      const roleId = await getApprovalRoleId(assignment.roleCode);
      if (!roleId) {
        console.log(`  Approval role ${assignment.roleCode} not found`);
        continue;
      }
      
      // Check if already assigned
      const [existing] = await connection.execute(
        'SELECT id FROM userApprovalRoles WHERE userId = ? AND approvalRoleId = ?',
        [assignment.userId, roleId]
      );
      
      if (existing.length > 0) {
        console.log(`  User ${assignment.userId} already has role ${assignment.roleCode}`);
        continue;
      }
      
      await connection.execute(
        `INSERT INTO userApprovalRoles (userId, approvalRoleId, isPrimary, isActive) VALUES (?, ?, true, true)`,
        [assignment.userId, roleId]
      );
      console.log(`  Assigned ${assignment.roleCode} to user ${assignment.userId}`);
    }
    
    console.log('\n=== Workflow Configuration Complete ===');
    console.log('Created 8 workflows with conditions and stages');
    console.log('Assigned approval roles to users');
    
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch(console.error);

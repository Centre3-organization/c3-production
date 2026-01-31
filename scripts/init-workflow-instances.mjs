/**
 * Initialize Workflow Instances for Existing Pending Requests
 * 
 * This script creates approvalInstances and approvalTasks for requests
 * that are in pending_l1 status but don't have workflow instances yet.
 */

import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

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
    // Get all pending requests without workflow instances
    const [pendingRequests] = await connection.execute(`
      SELECT r.id, r.requestNumber, r.type, r.siteId, r.requestorId
      FROM requests r
      LEFT JOIN approvalInstances ai ON r.id = ai.requestId
      WHERE r.status IN ('pending_l1', 'pending_manual', 'pending_approval')
        AND ai.id IS NULL
    `);
    
    console.log(`Found ${pendingRequests.length} pending requests without workflow instances`);
    
    if (pendingRequests.length === 0) {
      console.log('No requests to process');
      await connection.end();
      return;
    }
    
    // Get the default workflow (Standard Admin Visit Workflow or any active one)
    const [workflows] = await connection.execute(`
      SELECT id, name FROM approvalWorkflows 
      WHERE isActive = true 
      ORDER BY isDefault DESC, priority DESC 
      LIMIT 1
    `);
    
    if (workflows.length === 0) {
      console.log('No active workflows found. Creating a default workflow...');
      
      // Create a default workflow
      const [workflowResult] = await connection.execute(`
        INSERT INTO approvalWorkflows (name, description, processType, isActive, isDefault, priority)
        VALUES ('Default Approval Workflow', 'Default workflow for all requests', 'admin_visit', true, true, 100)
      `);
      
      const workflowId = workflowResult.insertId;
      
      // Create a single stage with Super Admin as approver
      const [stageResult] = await connection.execute(`
        INSERT INTO approvalStages (workflowId, stageName, stageOrder, approvalType, isActive)
        VALUES (?, 'Admin Review', 1, 'any', true)
      `, [workflowId]);
      
      const stageId = stageResult.insertId;
      
      // Get Super Admin user
      const [superAdmins] = await connection.execute(`
        SELECT u.id FROM users u
        INNER JOIN userSystemRoles usr ON u.id = usr.userId
        INNER JOIN systemRoles sr ON usr.roleId = sr.id
        WHERE sr.code = 'super_admin' AND usr.isActive = true
        LIMIT 1
      `);
      
      if (superAdmins.length > 0) {
        await connection.execute(`
          INSERT INTO stageApprovers (stageId, approverType, approverId)
          VALUES (?, 'user', ?)
        `, [stageId, superAdmins[0].id]);
      }
      
      console.log(`Created default workflow with ID ${workflowId}`);
      workflows.push({ id: workflowId, name: 'Default Approval Workflow' });
    }
    
    const workflow = workflows[0];
    console.log(`Using workflow: ${workflow.name} (ID: ${workflow.id})`);
    
    // Get first stage of the workflow
    const [stages] = await connection.execute(`
      SELECT id, stageName, stageOrder FROM approvalStages 
      WHERE workflowId = ?
      ORDER BY stageOrder ASC
      LIMIT 1
    `, [workflow.id]);
    
    if (stages.length === 0) {
      console.log('Workflow has no stages. Creating default stage...');
      
      const [stageResult] = await connection.execute(`
        INSERT INTO approvalStages (workflowId, stageName, stageOrder, approvalType, isActive)
        VALUES (?, 'Admin Review', 1, 'any', true)
      `, [workflow.id]);
      
      const stageId = stageResult.insertId;
      
      // Get Super Admin user
      const [superAdmins] = await connection.execute(`
        SELECT u.id FROM users u
        INNER JOIN userSystemRoles usr ON u.id = usr.userId
        INNER JOIN systemRoles sr ON usr.roleId = sr.id
        WHERE sr.code = 'super_admin' AND usr.isActive = true
        LIMIT 1
      `);
      
      if (superAdmins.length > 0) {
        await connection.execute(`
          INSERT INTO stageApprovers (stageId, approverType, approverId)
          VALUES (?, 'user', ?)
        `, [stageId, superAdmins[0].id]);
      }
      
      stages.push({ id: stageId, stageName: 'Admin Review', stageOrder: 1 });
    }
    
    const firstStage = stages[0];
    console.log(`First stage: ${firstStage.stageName} (ID: ${firstStage.id})`);
    
    // Get stage approvers
    const [approvers] = await connection.execute(`
      SELECT approverType, approverReference FROM stageApprovers
      WHERE stageId = ?
    `, [firstStage.id]);
    
    console.log(`Stage has ${approvers.length} approvers configured`);
    
    // If no approvers, add all super admins and admins
    let approverUserIds = [];
    
    if (approvers.length === 0) {
      console.log('No approvers configured. Adding all Super Admins and Admins...');
      
      const [adminUsers] = await connection.execute(`
        SELECT DISTINCT u.id FROM users u
        INNER JOIN userSystemRoles usr ON u.id = usr.userId
        INNER JOIN systemRoles sr ON usr.roleId = sr.id
        WHERE sr.code IN ('super_admin', 'admin') AND usr.isActive = true
      `);
      
      approverUserIds = adminUsers.map(u => u.id);
      
      // Add them as stage approvers
      for (const userId of approverUserIds) {
        await connection.execute(`
          INSERT INTO stageApprovers (stageId, approverType, approverId)
          VALUES (?, 'user', ?)
        `, [firstStage.id, userId]);
      }
      
      console.log(`Added ${approverUserIds.length} admin users as approvers`);
    } else {
      // Resolve approver user IDs
      for (const approver of approvers) {
        if (approver.approverType === 'user' && approver.approverReference) {
          approverUserIds.push(parseInt(approver.approverReference));
        } else if (approver.approverType === 'role' && approver.approverReference) {
          // Get users with this role by code
          const [roleUsers] = await connection.execute(`
            SELECT usr.userId FROM userSystemRoles usr
            INNER JOIN systemRoles sr ON usr.roleId = sr.id
            WHERE sr.code = ? AND usr.isActive = true
          `, [approver.approverReference]);
          approverUserIds.push(...roleUsers.map(u => u.userId));
        }
      }
    }
    
    // If still no approvers, use the first super admin
    if (approverUserIds.length === 0) {
      const [superAdmins] = await connection.execute(`
        SELECT u.id FROM users u
        INNER JOIN userSystemRoles usr ON u.id = usr.userId
        INNER JOIN systemRoles sr ON usr.roleId = sr.id
        WHERE sr.code = 'super_admin' AND usr.isActive = true
        LIMIT 1
      `);
      
      if (superAdmins.length > 0) {
        approverUserIds = [superAdmins[0].id];
      }
    }
    
    console.log(`Will assign tasks to ${approverUserIds.length} approvers: ${approverUserIds.join(', ')}`);
    
    // Create workflow instances and tasks for each pending request
    let created = 0;
    
    for (const request of pendingRequests) {
      try {
        // Create approval instance
        const [instanceResult] = await connection.execute(`
          INSERT INTO approvalInstances (requestId, requestType, workflowId, currentStageId, status, startedAt)
          VALUES (?, ?, ?, ?, 'in_progress', NOW())
        `, [request.id, request.type, workflow.id, firstStage.id]);
        
        const instanceId = instanceResult.insertId;
        
        // Create tasks for each approver
        for (const approverId of approverUserIds) {
          await connection.execute(`
            INSERT INTO approvalTasks (instanceId, stageId, assignedTo, status, createdAt)
            VALUES (?, ?, ?, 'pending', NOW())
          `, [instanceId, firstStage.id, approverId]);
        }
        
        // Record history
        await connection.execute(`
          INSERT INTO approvalHistory (instanceId, actionType, actionBy, details, actionAt)
          VALUES (?, 'workflow_started', ?, ?, NOW())
        `, [instanceId, request.requestorId, JSON.stringify({
          workflowName: workflow.name,
          firstStageName: firstStage.stageName,
          note: 'Workflow initialized by migration script'
        })]);
        
        // Update request status to pending_approval
        await connection.execute(`
          UPDATE requests SET status = 'pending_approval' WHERE id = ?
        `, [request.id]);
        
        created++;
        console.log(`  ✓ ${request.requestNumber}: Created instance ${instanceId} with ${approverUserIds.length} tasks`);
        
      } catch (err) {
        console.log(`  ✗ ${request.requestNumber}: Error - ${err.message}`);
      }
    }
    
    console.log(`\n=== Summary ===`);
    console.log(`Created ${created} workflow instances with tasks`);
    console.log(`Approvers can now see these in My Approvals`);
    
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch(console.error);

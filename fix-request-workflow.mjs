import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const requestId = 210013;
const instanceId = 120005; // Already created from previous run
const stageId = 30001; // L1 stage

// Get stage approvers with correct column name
const [approvers] = await conn.execute(`
  SELECT id, approverType, approverReference, approverConfig, priority
  FROM stageApprovers
  WHERE stageId = ?
  ORDER BY priority
`, [stageId]);

console.log("Stage approvers:", JSON.stringify(approvers, null, 2));

let taskCount = 0;

if (approvers.length === 0) {
  // No approvers - assign to all admins
  const [admins] = await conn.execute(`
    SELECT id, name FROM users WHERE role = 'admin'
  `);
  console.log("No approvers configured, assigning to admins:", admins.map(a => a.name));
  
  for (const admin of admins) {
    await conn.execute(`
      INSERT INTO approvalTasks (instanceId, stageId, assignedTo, assignedVia, status)
      VALUES (?, ?, ?, 'direct', 'pending')
    `, [instanceId, stageId, admin.id]);
    taskCount++;
  }
} else {
  for (const approver of approvers) {
    let userIds = [];
    
    if (approver.approverType === 'user') {
      if (approver.approverReference) {
        userIds.push(parseInt(approver.approverReference));
      }
    } else if (approver.approverType === 'role') {
      const [roleUsers] = await conn.execute(`
        SELECT id FROM users WHERE role = ?
      `, [approver.approverReference || 'admin']);
      userIds = roleUsers.map(u => u.id);
    } else if (approver.approverType === 'approval_role') {
      const [roleAssignments] = await conn.execute(`
        SELECT userId FROM userApprovalRoles WHERE approvalRoleId = ?
      `, [parseInt(approver.approverReference || '0')]);
      userIds = roleAssignments.map(r => r.userId);
    } else if (approver.approverType === 'group') {
      // Get all users in the group
      const [groupMembers] = await conn.execute(`
        SELECT userId FROM groupMembers WHERE groupId = ?
      `, [parseInt(approver.approverReference || '0')]);
      userIds = groupMembers.map(m => m.userId);
    }
    
    console.log(`Approver type=${approver.approverType}, ref=${approver.approverReference}, resolved users:`, userIds);
    
    for (const userId of userIds) {
      // Check if task already exists
      const [existing] = await conn.execute(`
        SELECT id FROM approvalTasks WHERE instanceId = ? AND stageId = ? AND assignedTo = ?
      `, [instanceId, stageId, userId]);
      
      if (existing.length === 0) {
        await conn.execute(`
          INSERT INTO approvalTasks (instanceId, stageId, assignedTo, assignedVia, status)
          VALUES (?, ?, ?, 'direct', 'pending')
        `, [instanceId, stageId, userId]);
        taskCount++;
      }
    }
  }
}

// Update request status to pending_approval
await conn.execute(`
  UPDATE requests SET status = 'pending_approval' WHERE id = ?
`, [requestId]);

// Add history record (if not already added)
const [existingHistory] = await conn.execute(`
  SELECT id FROM approvalHistory WHERE instanceId = ? AND actionType = 'workflow_started'
`, [instanceId]);

if (existingHistory.length === 0) {
  await conn.execute(`
    INSERT INTO approvalHistory (instanceId, actionType, actionBy, details)
    VALUES (?, 'workflow_started', 1, ?)
  `, [instanceId, JSON.stringify({ workflowName: 'Standard Approval Process', firstStageName: 'L1' })]);
}

console.log(`\nDone! Created ${taskCount} tasks for instance ${instanceId}`);
console.log(`Request status updated to pending_approval`);

// Verify
const [verify] = await conn.execute(`
  SELECT r.requestNumber, r.status, ai.status as instanceStatus, 
    COUNT(at2.id) as taskCount
  FROM requests r
  JOIN approvalInstances ai ON ai.requestId = r.id
  JOIN approvalTasks at2 ON at2.instanceId = ai.id
  WHERE r.id = ?
  GROUP BY r.requestNumber, r.status, ai.status
`, [requestId]);
console.log("\nVerification:", JSON.stringify(verify, null, 2));

await conn.end();

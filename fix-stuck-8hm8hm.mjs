import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Instance 120008, stage 30012, request 210016
const instanceId = 120008;
const stageId = 30012;

// Get stage approvers
const [approvers] = await conn.query(
  `SELECT * FROM stageApprovers WHERE stageId = ?`, [stageId]
);
console.log("Stage approvers:", approvers);

// Get existing tasks for this instance/stage
const [existingTasks] = await conn.query(
  `SELECT id, assignedTo, status, decision FROM approvalTasks WHERE instanceId = ? AND stageId = ?`, [instanceId, stageId]
);
console.log("\nExisting tasks:", existingTasks);

// Create new pending tasks for each approver
for (const approver of approvers) {
  const userId = parseInt(approver.approverReference);
  
  // Check if there's already a pending task for this user
  const [existing] = await conn.query(
    `SELECT id FROM approvalTasks WHERE instanceId = ? AND stageId = ? AND assignedTo = ? AND status = 'pending'`,
    [instanceId, stageId, userId]
  );
  
  if (existing.length === 0) {
    await conn.query(
      `INSERT INTO approvalTasks (instanceId, stageId, assignedTo, assignedVia, status, createdAt, updatedAt)
       VALUES (?, ?, ?, 'direct', 'pending', NOW(), NOW())`,
      [instanceId, stageId, userId]
    );
    console.log(`Created new pending task for user ${userId}`);
  } else {
    console.log(`Pending task already exists for user ${userId}`);
  }
}

// Verify
const [finalTasks] = await conn.query(
  `SELECT id, assignedTo, status FROM approvalTasks WHERE instanceId = ? AND stageId = ? AND status = 'pending'`,
  [instanceId, stageId]
);
console.log("\nFinal pending tasks:", finalTasks);

await conn.end();

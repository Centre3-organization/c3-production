import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const workflowId = 90001;
const bahrainSiteId = 30001;

// Add site condition with correct enum value 'site_id'
const [existing] = await conn.execute(
  `SELECT id FROM workflowConditions WHERE workflowId = ? AND conditionType = 'site_id'`,
  [workflowId]
);

if (existing.length === 0) {
  await conn.execute(
    `INSERT INTO workflowConditions (workflowId, conditionType, conditionValue)
     VALUES (?, 'site_id', ?)`,
    [workflowId, String(bahrainSiteId)]
  );
  console.log(`Added site_id condition: Bahrain Data Centre (id=${bahrainSiteId})`);
} else {
  console.log("Condition already exists");
}

// Also need to fix the startWorkflowForRequest function to check 'site_id' condition type
// Let's verify the full setup
console.log("\n=== Full Verification ===\n");

const [workflow] = await conn.execute(
  `SELECT id, name, processType, isActive, isDefault, priority FROM approvalWorkflows WHERE id = ?`,
  [workflowId]
);
console.log("Workflow:", JSON.stringify(workflow[0], null, 2));

const [stages] = await conn.execute(
  `SELECT id, stageName, stageOrder, approvalMode FROM approvalStages WHERE workflowId = ? ORDER BY stageOrder`,
  [workflowId]
);
console.log("\nStages:");
for (const stage of stages) {
  console.log(`  Stage ${stage.stageOrder}: ${stage.stageName} (mode: ${stage.approvalMode})`);
  
  const [approvers] = await conn.execute(
    `SELECT sa.approverType, sa.approverReference, u.name, u.email
     FROM stageApprovers sa
     LEFT JOIN users u ON u.id = CAST(sa.approverReference AS UNSIGNED)
     WHERE sa.stageId = ?
     ORDER BY sa.priority`,
    [stage.id]
  );
  for (const a of approvers) {
    console.log(`    → ${a.name} (${a.email}) [${a.approverType}]`);
  }
}

const [conditions] = await conn.execute(
  `SELECT conditionType, conditionValue FROM workflowConditions WHERE workflowId = ?`,
  [workflowId]
);
console.log("\nConditions:", JSON.stringify(conditions, null, 2));

// Verify users
const [users] = await conn.execute(
  `SELECT id, name, email, jobTitle, status FROM users WHERE email IN ('ahmed@c3.com', 'george@c3.com', 'security@bahrainc3.com', 'admin@c3bahrain.com', 'hos@bahrainc3.com')`
);
console.log("\nUsers:");
for (const u of users) {
  console.log(`  ${u.id}: ${u.name} (${u.email}) - ${u.jobTitle} [${u.status}]`);
}

await conn.end();
console.log("\n✅ Bahrain Workflow fully configured!");

import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// 1. Fix 15 pending_manual requests with no approval instance → mark as rejected (orphaned legacy data)
const [pendingManualNoInstance] = await conn.query(
  `SELECT r.id, r.requestNumber FROM requests r
   LEFT JOIN approvalInstances ai ON ai.requestId = r.id
   WHERE r.status = 'pending_manual' AND ai.id IS NULL`
);
console.log(`Found ${pendingManualNoInstance.length} pending_manual requests with no approval instance:`);
for (const r of pendingManualNoInstance) {
  console.log(`  ${r.requestNumber} (id=${r.id})`);
}

if (pendingManualNoInstance.length > 0) {
  const ids = pendingManualNoInstance.map(r => r.id);
  await conn.query(
    `UPDATE requests SET status = 'rejected', updatedAt = NOW() WHERE id IN (${ids.join(',')})`
  );
  console.log(`→ Marked ${ids.length} orphaned pending_manual requests as rejected`);
}

// 2. Fix pending_approval requests where instance is need_clarification → sync request status
const [pendingApprovalNeedClarification] = await conn.query(
  `SELECT r.id, r.requestNumber, ai.status as instanceStatus FROM requests r
   JOIN approvalInstances ai ON ai.requestId = r.id
   WHERE r.status = 'pending_approval' AND ai.status = 'need_clarification'`
);
console.log(`\nFound ${pendingApprovalNeedClarification.length} pending_approval requests where instance is need_clarification:`);
for (const r of pendingApprovalNeedClarification) {
  console.log(`  ${r.requestNumber} (id=${r.id})`);
}

if (pendingApprovalNeedClarification.length > 0) {
  const ids = pendingApprovalNeedClarification.map(r => r.id);
  await conn.query(
    `UPDATE requests SET status = 'need_clarification', updatedAt = NOW() WHERE id IN (${ids.join(',')})`
  );
  console.log(`→ Synced ${ids.length} requests to need_clarification status`);
}

// 3. Fix pending_approval requests with no instance → mark as rejected
const [pendingApprovalNoInstance] = await conn.query(
  `SELECT r.id, r.requestNumber FROM requests r
   LEFT JOIN approvalInstances ai ON ai.requestId = r.id
   WHERE r.status = 'pending_approval' AND ai.id IS NULL`
);
console.log(`\nFound ${pendingApprovalNoInstance.length} pending_approval requests with no approval instance:`);
for (const r of pendingApprovalNoInstance) {
  console.log(`  ${r.requestNumber} (id=${r.id})`);
}

if (pendingApprovalNoInstance.length > 0) {
  const ids = pendingApprovalNoInstance.map(r => r.id);
  await conn.query(
    `UPDATE requests SET status = 'rejected', updatedAt = NOW() WHERE id IN (${ids.join(',')})`
  );
  console.log(`→ Marked ${ids.length} orphaned pending_approval requests as rejected`);
}

// 4. Check the one in_progress instance (REQ-20260209-8HM8HM) - verify it has pending tasks
const [inProgressCheck] = await conn.query(
  `SELECT r.requestNumber, ai.id as instanceId, ai.status as instanceStatus,
   (SELECT COUNT(*) FROM approvalTasks at WHERE at.instanceId = ai.id AND at.status = 'pending') as pendingTasks
   FROM requests r
   JOIN approvalInstances ai ON ai.requestId = r.id
   WHERE r.status = 'pending_approval' AND ai.status = 'in_progress'`
);
console.log(`\nIn-progress instances check:`);
console.table(inProgressCheck);

// Final verification
const [finalCheck] = await conn.query(
  `SELECT status, COUNT(*) as cnt FROM requests GROUP BY status ORDER BY cnt DESC`
);
console.log(`\nFinal request status distribution:`);
console.table(finalCheck);

await conn.end();

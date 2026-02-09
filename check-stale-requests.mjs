import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Check request status distribution
const [statusDist] = await conn.query(
  "SELECT status, COUNT(*) as cnt FROM requests GROUP BY status ORDER BY cnt DESC"
);
console.log("Request status distribution:");
console.table(statusDist);

// Check requests with pending_l1 status
const [pendingL1] = await conn.query(
  `SELECT r.id, r.requestNumber, r.status, ai.status as instanceStatus, ai.id as instanceId
   FROM requests r
   LEFT JOIN approvalInstances ai ON ai.requestId = r.id
   WHERE r.status = 'pending_l1'
   LIMIT 20`
);
console.log("\npending_l1 requests with their instance status:");
console.table(pendingL1);

// Check requests with pending_manual status
const [pendingManual] = await conn.query(
  `SELECT r.id, r.requestNumber, r.status, ai.status as instanceStatus
   FROM requests r
   LEFT JOIN approvalInstances ai ON ai.requestId = r.id
   WHERE r.status = 'pending_manual'
   LIMIT 20`
);
console.log("\npending_manual requests with their instance status:");
console.table(pendingManual);

// Check requests with pending_approval status
const [pendingApproval] = await conn.query(
  `SELECT r.id, r.requestNumber, r.status, ai.status as instanceStatus
   FROM requests r
   LEFT JOIN approvalInstances ai ON ai.requestId = r.id
   WHERE r.status = 'pending_approval'
   LIMIT 20`
);
console.log("\npending_approval requests with their instance status:");
console.table(pendingApproval);

// Check actual pending tasks
const [pendingTasks] = await conn.query(
  `SELECT at.id, at.instanceId, at.status, ai.status as instanceStatus, r.requestNumber, r.status as reqStatus
   FROM approvalTasks at
   JOIN approvalInstances ai ON ai.id = at.instanceId
   JOIN requests r ON r.id = ai.requestId
   WHERE at.status = 'pending' AND ai.status = 'in_progress'`
);
console.log("\nActual pending tasks (tasks=pending AND instance=in_progress):");
console.table(pendingTasks);

await conn.end();

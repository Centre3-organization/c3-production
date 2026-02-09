import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Check the request
const [rows] = await conn.execute(`
  SELECT r.id, r.requestNumber, r.status, r.type, r.categoryId, r.createdAt,
    ai.id as instanceId, ai.status as instanceStatus, ai.currentStageId, ai.workflowId,
    at2.id as taskId, at2.status as taskStatus, at2.assignedTo, at2.stageId
  FROM requests r
  LEFT JOIN approvalInstances ai ON ai.requestId = r.id
  LEFT JOIN approvalTasks at2 ON at2.instanceId = ai.id
  WHERE r.requestNumber = 'REQ-20260209-D2D19Q'
`);

console.log("Request + Instance + Tasks:");
console.log(JSON.stringify(rows, null, 2));

// Check if there are ANY pending tasks in the system
const [pendingTasks] = await conn.execute(`
  SELECT COUNT(*) as cnt FROM approvalTasks WHERE status = 'pending'
`);
console.log("\nTotal pending tasks:", pendingTasks[0].cnt);

// Check the admin query logic - what does it filter on
const [pendingInstances] = await conn.execute(`
  SELECT ai.id, ai.status, ai.requestId, r.requestNumber 
  FROM approvalInstances ai
  JOIN requests r ON r.id = ai.requestId
  WHERE ai.status = 'in_progress'
  ORDER BY ai.id DESC
  LIMIT 10
`);
console.log("\nIn-progress instances:", JSON.stringify(pendingInstances, null, 2));

await conn.end();

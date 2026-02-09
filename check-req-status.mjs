import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();
const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute(`
  SELECT r.id, r.requestNumber, r.status, ai.id as instanceId, ai.status as instanceStatus, 
    at2.id as taskId, at2.status as taskStatus, at2.decision, at2.clarificationTarget, at2.comments
  FROM requests r
  LEFT JOIN approvalInstances ai ON ai.requestId = r.id
  LEFT JOIN approvalTasks at2 ON at2.instanceId = ai.id
  WHERE r.requestNumber = 'REQ-20260209-D2D19Q'
`);
console.log(JSON.stringify(rows, null, 2));
await conn.end();

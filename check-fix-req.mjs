import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq, and, desc } from "drizzle-orm";

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(conn);

// Check request status
const [reqRows] = await conn.query(
  "SELECT id, requestNumber, status, requestorId FROM requests WHERE requestNumber = 'REQ-20260209-D2D19Q'"
);
console.log("Request:", reqRows);

if (reqRows.length > 0) {
  const reqId = reqRows[0].id;
  
  // Check approval instance
  const [instances] = await conn.query(
    "SELECT * FROM approvalInstances WHERE requestId = ?", [reqId]
  );
  console.log("\nApproval Instance:", instances);
  
  if (instances.length > 0) {
    const instanceId = instances[0].id;
    
    // Check approval tasks
    const [tasks] = await conn.query(
      "SELECT id, stageId, assignedTo, status, decision, comments FROM approvalTasks WHERE instanceId = ?", [instanceId]
    );
    console.log("\nApproval Tasks:", tasks);
    
    // Check approval history
    const [history] = await conn.query(
      "SELECT * FROM approvalHistory WHERE instanceId = ? ORDER BY id DESC LIMIT 5", [instanceId]
    );
    console.log("\nApproval History:", history);
    
    // Check comments
    const [commentRows] = await conn.query(
      "SELECT * FROM requestComments WHERE requestId = ? ORDER BY id DESC LIMIT 5", [reqId]
    );
    console.log("\nComments:", commentRows);
  }
}

await conn.end();

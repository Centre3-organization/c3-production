import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq, like } from "drizzle-orm";
import * as schema from "./drizzle/schema.ts";

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(conn, { schema, mode: "default" });

// 1. Find the request
const requests = await db.select().from(schema.requests)
  .where(like(schema.requests.requestNumber, "%QC1CT5%"));

if (requests.length === 0) {
  console.log("Request not found!");
  await conn.end();
  process.exit(1);
}

const req = requests[0];
console.log("=== Request Details ===");
console.log(`  ID: ${req.id}`);
console.log(`  Number: ${req.requestNumber}`);
console.log(`  Status: ${req.status}`);
console.log(`  Type: ${req.type}`);
console.log(`  SiteId: ${req.siteId}`);
console.log(`  CategoryId: ${req.categoryId}`);
console.log(`  SelectedTypeIds: ${JSON.stringify(req.selectedTypeIds)}`);

// 2. Check the approval instance
const instances = await db.select().from(schema.approvalInstances)
  .where(eq(schema.approvalInstances.requestId, req.id));

if (instances.length > 0) {
  const inst = instances[0];
  console.log("\n=== Approval Instance ===");
  console.log(`  ID: ${inst.id}`);
  console.log(`  WorkflowId: ${inst.workflowId}`);
  console.log(`  Status: ${inst.status}`);
  console.log(`  CurrentStageId: ${inst.currentStageId}`);

  // Get workflow name
  const workflow = await db.select().from(schema.approvalWorkflows)
    .where(eq(schema.approvalWorkflows.id, inst.workflowId));
  console.log(`  Workflow Name: ${workflow[0]?.name}`);

  // Get tasks
  const tasks = await db.select().from(schema.approvalTasks)
    .where(eq(schema.approvalTasks.instanceId, inst.id));
  console.log(`\n  Tasks (${tasks.length}):`);
  for (const t of tasks) {
    const user = await db.select().from(schema.users).where(eq(schema.users.id, t.assignedTo));
    console.log(`    → ${user[0]?.name} (${user[0]?.email}) - status=${t.status}`);
  }
} else {
  console.log("\n  No approval instance found!");
}

// 3. Check all workflows and their conditions
console.log("\n=== All Active Workflows ===");
const workflows = await db.select().from(schema.approvalWorkflows);
for (const w of workflows) {
  const conditions = await db.select().from(schema.workflowConditions)
    .where(eq(schema.workflowConditions.workflowId, w.id));
  console.log(`\n  [${w.id}] ${w.name} (processType=${w.processType}, priority=${w.priority}, isDefault=${w.isDefault})`);
  for (const c of conditions) {
    console.log(`    Condition: ${c.conditionType} ${c.operator} ${c.conditionValue}`);
  }
}

// 4. Check the site
if (req.siteId) {
  const sites = await db.select().from(schema.sites).where(eq(schema.sites.id, req.siteId));
  console.log(`\n=== Site ===`);
  console.log(`  ID: ${sites[0]?.id}, Name: ${sites[0]?.name}`);
}

await conn.end();

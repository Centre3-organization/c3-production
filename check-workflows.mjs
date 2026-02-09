import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Check all active workflows
const [workflows] = await conn.execute(`
  SELECT id, name, processType, isActive, isDefault, priority
  FROM approvalWorkflows
  WHERE isActive = 1
  ORDER BY priority DESC
`);
console.log("Active workflows:");
console.log(JSON.stringify(workflows, null, 2));

// Check workflow conditions
const [conditions] = await conn.execute(`
  SELECT wc.id, wc.workflowId, wc.conditionType, wc.conditionValue, aw.name as workflowName
  FROM workflowConditions wc
  JOIN approvalWorkflows aw ON aw.id = wc.workflowId
  WHERE aw.isActive = 1
`);
console.log("\nWorkflow conditions:");
console.log(JSON.stringify(conditions, null, 2));

// Check what processType the request has
const [req] = await conn.execute(`
  SELECT id, requestNumber, type, status, siteId, categoryId, selectedTypeIds
  FROM requests WHERE requestNumber = 'REQ-20260209-D2D19Q'
`);
console.log("\nRequest details:");
console.log(JSON.stringify(req, null, 2));

// Check the old approvals table for this request
const [oldApprovals] = await conn.execute(`
  SELECT * FROM approvals WHERE requestId = ?
`, [req[0].id]);
console.log("\nLegacy approvals:");
console.log(JSON.stringify(oldApprovals, null, 2));

await conn.end();

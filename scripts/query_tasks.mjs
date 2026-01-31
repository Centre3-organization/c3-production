import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute(`
  SELECT at.id, at.status, at.decision, ai.status as instanceStatus, r.requestNumber, asStage.stageName
  FROM approvalTasks at 
  JOIN approvalInstances ai ON at.instanceId = ai.id 
  JOIN requests r ON ai.requestId = r.id 
  JOIN approvalStages asStage ON at.stageId = asStage.id
  ORDER BY at.id DESC LIMIT 20
`);
console.log(JSON.stringify(rows, null, 2));
await conn.end();

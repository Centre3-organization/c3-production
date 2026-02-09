import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const [instance] = await conn.query(
  `SELECT * FROM approvalInstances WHERE id = 120008`
);
console.log("Instance:", instance);

const [tasks] = await conn.query(
  `SELECT * FROM approvalTasks WHERE instanceId = 120008`
);
console.log("\nTasks:", tasks);

const [history] = await conn.query(
  `SELECT * FROM approvalHistory WHERE instanceId = 120008 ORDER BY id DESC`
);
console.log("\nHistory:", history);

await conn.end();

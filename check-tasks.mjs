import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL);
  
  // Check task status distribution
  const [rows1] = await conn.execute('SELECT status, COUNT(*) as cnt FROM approvalTasks GROUP BY status');
  console.log('Task status distribution:');
  console.table(rows1);
  
  // Check pending tasks specifically
  const [rows2] = await conn.execute('SELECT id, instanceId, stageId, status, assignedTo FROM approvalTasks WHERE status = "pending" LIMIT 20');
  console.log('\nPending tasks:');
  console.table(rows2);
  
  // Check request statuses
  const [rows3] = await conn.execute('SELECT status, COUNT(*) as cnt FROM requests GROUP BY status');
  console.log('\nRequest status distribution:');
  console.table(rows3);
  
  // Check approval instance statuses
  const [rows4] = await conn.execute('SELECT status, COUNT(*) as cnt FROM approvalInstances GROUP BY status');
  console.log('\nApproval instance status distribution:');
  console.table(rows4);
  
  await conn.end();
}

main().catch(console.error);

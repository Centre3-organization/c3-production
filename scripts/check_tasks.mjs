import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
function parseConnectionString(url) {
  const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
  if (!match) throw new Error('Invalid DATABASE_URL format');
  return { user: match[1], password: match[2], host: match[3], port: parseInt(match[4]), database: match[5], ssl: { rejectUnauthorized: true } };
}

async function main() {
  const config = parseConnectionString(DATABASE_URL);
  const connection = await mysql.createConnection(config);
  
  const [tasks] = await connection.execute('SELECT COUNT(*) as cnt FROM approvalTasks WHERE status = "pending"');
  console.log('Pending tasks count:', tasks[0].cnt);
  
  const [instances] = await connection.execute('SELECT COUNT(*) as cnt FROM approvalInstances WHERE status = "active"');
  console.log('Active instances count:', instances[0].cnt);
  
  const [pendingRequests] = await connection.execute('SELECT COUNT(*) as cnt FROM requests WHERE status IN ("pending_l1", "pending_manual", "pending_approval")');
  console.log('Pending requests count:', pendingRequests[0].cnt);
  
  await connection.end();
}
main().catch(console.error);

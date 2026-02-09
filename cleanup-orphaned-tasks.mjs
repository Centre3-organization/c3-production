import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL);
  
  // 1. Show breakdown of pending tasks by instance status
  const [breakdown] = await conn.execute(`
    SELECT i.status as instanceStatus, COUNT(t.id) as pendingTaskCount 
    FROM approvalTasks t 
    INNER JOIN approvalInstances i ON t.instanceId = i.id 
    WHERE t.status = 'pending' 
    GROUP BY i.status
  `);
  console.log('=== Pending tasks breakdown by instance status ===');
  console.table(breakdown);
  
  // 2. Show the orphaned tasks (pending tasks in non-in_progress instances)
  const [orphaned] = await conn.execute(`
    SELECT t.id as taskId, t.instanceId, i.status as instanceStatus, i.requestId, r.requestNumber, r.status as requestStatus
    FROM approvalTasks t 
    INNER JOIN approvalInstances i ON t.instanceId = i.id 
    INNER JOIN requests r ON i.requestId = r.id
    WHERE t.status = 'pending' AND i.status != 'in_progress'
    ORDER BY t.id
  `);
  console.log(`\n=== ${orphaned.length} orphaned pending tasks to clean up ===`);
  console.table(orphaned);
  
  if (orphaned.length === 0) {
    console.log('\nNo orphaned tasks to clean up. All good!');
    await conn.end();
    return;
  }
  
  // 3. Perform the cleanup - mark orphaned pending tasks as "skipped"
  const [result] = await conn.execute(`
    UPDATE approvalTasks t
    INNER JOIN approvalInstances i ON t.instanceId = i.id
    SET t.status = 'skipped', t.decidedAt = NOW()
    WHERE t.status = 'pending' AND i.status != 'in_progress'
  `);
  console.log(`\n=== Cleanup complete: ${result.affectedRows} tasks marked as "skipped" ===`);
  
  // 4. Verify - check remaining pending tasks
  const [remaining] = await conn.execute(`
    SELECT t.status, COUNT(*) as cnt 
    FROM approvalTasks t 
    GROUP BY t.status 
    ORDER BY cnt DESC
  `);
  console.log('\n=== Updated task status distribution ===');
  console.table(remaining);
  
  // 5. Verify no orphans remain
  const [orphansLeft] = await conn.execute(`
    SELECT COUNT(*) as cnt
    FROM approvalTasks t 
    INNER JOIN approvalInstances i ON t.instanceId = i.id 
    WHERE t.status = 'pending' AND i.status != 'in_progress'
  `);
  console.log(`\nOrphaned pending tasks remaining: ${orphansLeft[0].cnt}`);
  
  await conn.end();
}

main().catch(console.error);

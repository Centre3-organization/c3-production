import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

async function main() {
  const connection = await mysql.createConnection(DATABASE_URL);
  console.log('Connected to database');
  
  try {
    // Get sites
    const [sites] = await connection.execute('SELECT id, name FROM sites LIMIT 5');
    console.log(`Found ${sites.length} sites`);
    
    // Get test users
    const [users] = await connection.execute(`
      SELECT id, email, firstName, lastName FROM users 
      WHERE email LIKE '%@centre3.com' OR email LIKE '%@aws.com' OR email LIKE '%@google.com'
      LIMIT 20
    `);
    console.log(`Found ${users.length} test users`);
    
    // Get workflow for TEP/MOP
    const [workflows] = await connection.execute(`
      SELECT id, name FROM approvalWorkflows WHERE isActive = true LIMIT 1
    `);
    
    if (workflows.length === 0) {
      console.log('No active workflow found');
      return;
    }
    
    const workflow = workflows[0];
    console.log(`Using workflow: ${workflow.name} (ID: ${workflow.id})`);
    
    // Get first stage
    const [stages] = await connection.execute(`
      SELECT id, stageName, stageOrder FROM approvalStages 
      WHERE workflowId = ?
      ORDER BY stageOrder ASC
      LIMIT 1
    `, [workflow.id]);
    
    if (stages.length === 0) {
      console.log('No stages found for workflow');
      return;
    }
    
    const firstStage = stages[0];
    console.log(`First stage: ${firstStage.stageName} (ID: ${firstStage.id})`);
    
    // Get stage approvers
    const [approvers] = await connection.execute(`
      SELECT approverType, approverReference FROM stageApprovers WHERE stageId = ?
    `, [firstStage.id]);
    
    // Get approver user IDs
    let approverUserIds = [];
    
    // Get super admins and admins as fallback approvers
    const [adminUsers] = await connection.execute(`
      SELECT DISTINCT usr.userId FROM userSystemRoles usr
      INNER JOIN systemRoles sr ON usr.roleId = sr.id
      WHERE sr.code IN ('super_admin', 'admin') AND usr.isActive = true
    `);
    
    if (approvers.length === 0) {
      approverUserIds = adminUsers.map(u => u.userId);
      console.log(`Using ${approverUserIds.length} admin users as approvers`);
    } else {
      for (const approver of approvers) {
        if (approver.approverType === 'user' && approver.approverReference) {
          approverUserIds.push(parseInt(approver.approverReference));
        } else if (approver.approverType === 'role' && approver.approverReference) {
          const [roleUsers] = await connection.execute(`
            SELECT usr.userId FROM userSystemRoles usr
            INNER JOIN systemRoles sr ON usr.roleId = sr.id
            WHERE sr.code = ? AND usr.isActive = true
          `, [approver.approverReference]);
          approverUserIds.push(...roleUsers.map(u => u.userId));
        }
      }
    }
    
    // If still no approvers, use first admin
    if (approverUserIds.length === 0 && adminUsers.length > 0) {
      approverUserIds = [adminUsers[0].userId];
    }
    
    console.log(`Will assign tasks to ${approverUserIds.length} approvers: ${approverUserIds.join(', ')}`);
    
    // Define 20 TEP/MOP test requests
    const testRequests = [
      // TEP Requests (10)
      { type: 'tep', purpose: 'TEP-001: Network Equipment Installation', visitor: 'Ahmed Al-Rashid', company: 'Centre3', site: 0 },
      { type: 'tep', purpose: 'TEP-002: Server Rack Maintenance', visitor: 'Mohammed Al-Farsi', company: 'Centre3', site: 1 },
      { type: 'tep', purpose: 'TEP-003: Fiber Optic Cable Testing', visitor: 'Khalid Al-Saud', company: 'Amazon Web Services', site: 0 },
      { type: 'tep', purpose: 'TEP-004: Power Distribution Unit Upgrade', visitor: 'Omar Al-Qahtani', company: 'Google Cloud', site: 1 },
      { type: 'tep', purpose: 'TEP-005: HVAC System Inspection', visitor: 'Faisal Al-Dosari', company: 'Centre3', site: 0 },
      { type: 'tep', purpose: 'TEP-006: UPS Battery Replacement', visitor: 'Saad Al-Mutairi', company: 'Amazon Web Services', site: 1 },
      { type: 'tep', purpose: 'TEP-007: Fire Suppression System Test', visitor: 'Turki Al-Otaibi', company: 'Centre3', site: 0 },
      { type: 'tep', purpose: 'TEP-008: Security Camera Installation', visitor: 'Nasser Al-Harbi', company: 'Google Cloud', site: 1 },
      { type: 'tep', purpose: 'TEP-009: Access Control System Upgrade', visitor: 'Bandar Al-Shammari', company: 'Centre3', site: 0 },
      { type: 'tep', purpose: 'TEP-010: Generator Maintenance', visitor: 'Abdulaziz Al-Ghamdi', company: 'Amazon Web Services', site: 1 },
      
      // MOP Requests (10)
      { type: 'mop', purpose: 'MOP-001: Scheduled Server Reboot', visitor: 'Youssef Al-Zahrani', company: 'Centre3', site: 0 },
      { type: 'mop', purpose: 'MOP-002: Network Switch Configuration', visitor: 'Ibrahim Al-Malki', company: 'Google Cloud', site: 1 },
      { type: 'mop', purpose: 'MOP-003: Database Migration Procedure', visitor: 'Hamad Al-Dossary', company: 'Amazon Web Services', site: 0 },
      { type: 'mop', purpose: 'MOP-004: Firewall Rule Update', visitor: 'Saleh Al-Qahtani', company: 'Centre3', site: 1 },
      { type: 'mop', purpose: 'MOP-005: Load Balancer Configuration', visitor: 'Majed Al-Otaibi', company: 'Google Cloud', site: 0 },
      { type: 'mop', purpose: 'MOP-006: SSL Certificate Renewal', visitor: 'Fahad Al-Harbi', company: 'Amazon Web Services', site: 1 },
      { type: 'mop', purpose: 'MOP-007: DNS Record Update', visitor: 'Sultan Al-Shammari', company: 'Centre3', site: 0 },
      { type: 'mop', purpose: 'MOP-008: Backup System Test', visitor: 'Nawaf Al-Ghamdi', company: 'Google Cloud', site: 1 },
      { type: 'mop', purpose: 'MOP-009: Storage Array Expansion', visitor: 'Rakan Al-Zahrani', company: 'Amazon Web Services', site: 0 },
      { type: 'mop', purpose: 'MOP-010: Monitoring System Update', visitor: 'Mishal Al-Malki', company: 'Centre3', site: 1 },
    ];
    
    const now = new Date();
    const startDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    const endDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days from now
    
    console.log('\\n--- Creating TEP/MOP Test Requests ---');
    
    for (let i = 0; i < testRequests.length; i++) {
      const req = testRequests[i];
      const siteId = sites[req.site % sites.length]?.id || sites[0]?.id || 2;
      const timestamp = Date.now();
      const requestNumber = `REQ-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${req.type.toUpperCase()}${String(i + 1).padStart(3, '0')}-${timestamp}`;
      
      // Get a random user as requestor
      const requestorId = users[i % users.length]?.id || 3;
      
      // Insert request
      const [result] = await connection.execute(`
        INSERT INTO requests (
          requestNumber, type, status, visitorName, visitorCompany, 
          visitorIdType, visitorIdNumber, visitorPhone, visitorEmail,
          purpose, siteId, startDate, endDate, requestorId, createdAt, updatedAt
        ) VALUES (?, ?, 'pending_approval', ?, ?, 'national_id', ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        requestNumber,
        req.type,
        req.visitor,
        req.company,
        `10${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
        `+966${String(Math.floor(Math.random() * 1000000000)).padStart(9, '0')}`,
        `${req.visitor.toLowerCase().replace(/[^a-z]/g, '')}@${req.company.toLowerCase().replace(/[^a-z]/g, '')}.com`,
        req.purpose,
        siteId,
        startDate.toISOString().slice(0, 10),
        endDate.toISOString().slice(0, 10),
        requestorId
      ]);
      
      const requestId = result.insertId;
      
      // Create workflow instance
      const [instanceResult] = await connection.execute(`
        INSERT INTO approvalInstances (
          requestId, workflowId, requestType, currentStageId, status, createdAt
        ) VALUES (?, ?, ?, ?, 'in_progress', NOW())
      `, [requestId, workflow.id, req.type, firstStage.id]);
      
      const instanceId = instanceResult.insertId;
      
      // Create approval tasks for each approver
      for (const approverId of approverUserIds) {
        await connection.execute(`
          INSERT INTO approvalTasks (
            instanceId, stageId, assignedTo, status, createdAt
          ) VALUES (?, ?, ?, 'pending', NOW())
        `, [instanceId, firstStage.id, approverId]);
      }
      
      console.log(`  ✓ ${requestNumber}: ${req.purpose}`);
    }
    
    console.log('\\n--- TEP/MOP Test Requests Created Successfully ---');
    console.log(`Created ${testRequests.length} requests with workflow instances`);
    
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch(console.error);

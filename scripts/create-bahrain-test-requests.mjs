/**
 * Create 20 test requests on Bahrain Data Centre (siteId=30001)
 * covering all request types for client presentation validation
 */
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

// Bahrain site data
const BAHRAIN = {
  siteId: 30001,
  countryId: 2,
  cityId: 7,
  zoneId: 30001,
  areaId: 30001,
};

// Request types
const REQUEST_TYPES = {
  ADMIN_VISIT: { id: 1, code: 'admin_visit', categoryId: 1 },
  TEP: { id: 2, code: 'tep', categoryId: 1 },
  WORK_PERMISSION: { id: 3, code: 'work_permit', categoryId: 2 },
  MOP: { id: 4, code: 'mop', categoryId: 2 },
  MHV: { id: 5, code: 'material_entry', categoryId: 2 },
  VISITOR_REG: { id: 6, code: 'admin_visit', categoryId: 3 },
};

// Users who can submit requests
const REQUESTOR_IDS = [3, 90182, 90183, 150005, 150009, 150010];

// Host users
const HOST_IDS = [150006, 150007, 150008];

// Generate unique request number
function generateRequestNumber() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let random = '';
  for (let i = 0; i < 6; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `REQ-${dateStr}-${random}`;
}

// Generate future date string
function futureDate(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

// Visitor names for test data
const VISITORS = [
  { name: 'Ahmad Hassan', idType: 'national_id', idNumber: 'BH1234567890', nationality: 'Bahraini', company: 'Gulf Tech Solutions', jobTitle: 'Network Engineer', phone: '+97312345678' },
  { name: 'Fatima Al-Khalifa', idType: 'national_id', idNumber: 'BH9876543210', nationality: 'Bahraini', company: 'Bahrain Telecom', jobTitle: 'IT Manager', phone: '+97398765432' },
  { name: 'James Wilson', idType: 'passport', idNumber: 'US789456123', nationality: 'American', company: 'CloudCore Inc', jobTitle: 'Solutions Architect', phone: '+14155551234' },
  { name: 'Yusuf Al-Mansoori', idType: 'national_id', idNumber: 'BH5678901234', nationality: 'Bahraini', company: 'Batelco', jobTitle: 'Security Consultant', phone: '+97333445566' },
  { name: 'Sarah Chen', idType: 'passport', idNumber: 'CN456789012', nationality: 'Chinese', company: 'Huawei Technologies', jobTitle: 'Project Manager', phone: '+8613812345678' },
  { name: 'Mohammed Al-Dosari', idType: 'iqama', idNumber: 'SA2345678901', nationality: 'Saudi', company: 'STC', jobTitle: 'Field Technician', phone: '+966501234567' },
  { name: 'Priya Sharma', idType: 'passport', idNumber: 'IN789012345', nationality: 'Indian', company: 'Infosys', jobTitle: 'Software Developer', phone: '+919876543210' },
  { name: 'Omar Al-Farsi', idType: 'national_id', idNumber: 'BH3456789012', nationality: 'Bahraini', company: 'VIVA Bahrain', jobTitle: 'Operations Lead', phone: '+97377889900' },
  { name: 'David Brown', idType: 'passport', idNumber: 'UK567890123', nationality: 'British', company: 'BT Group', jobTitle: 'Data Centre Specialist', phone: '+447911123456' },
  { name: 'Noura Al-Sayed', idType: 'national_id', idNumber: 'BH6789012345', nationality: 'Bahraini', company: 'Tamkeen', jobTitle: 'Business Analyst', phone: '+97366778899' },
];

// Purposes for different request types
const PURPOSES = {
  admin_visit: [
    'Quarterly infrastructure audit and compliance review',
    'Emergency power system inspection and testing',
    'Annual fire safety certification review',
    'Client facility tour and capability demonstration',
    'Vendor equipment evaluation and benchmarking',
  ],
  tep: [
    'Fiber optic cable installation in Hall B',
    'UPS battery replacement and testing',
    'CCTV system upgrade and configuration',
    'Network switch deployment in new rack',
    'Cooling system maintenance and optimization',
  ],
  work_permit: [
    'Server rack installation in Zone A',
    'Electrical panel upgrade - Phase 3',
    'Cable tray installation above raised floor',
    'Generator maintenance and load testing',
    'Fire suppression system annual service',
  ],
  material_entry: [
    'Delivery of 20x Dell PowerEdge R750 servers',
    'Network equipment: Cisco Nexus 9000 switches',
    'UPS batteries replacement stock',
    'Fiber optic patch panels and cables',
    'Cooling unit spare parts delivery',
  ],
};

// Build 20 test requests
function buildTestRequests() {
  const requests = [];
  
  // 5 Admin Visit requests
  for (let i = 0; i < 5; i++) {
    const visitor = VISITORS[i];
    const requestorId = REQUESTOR_IDS[i % REQUESTOR_IDS.length];
    const hostId = HOST_IDS[i % HOST_IDS.length];
    requests.push({
      requestNumber: generateRequestNumber(),
      type: 'admin_visit',
      status: 'pending_approval',
      visitorName: visitor.name,
      visitorIdType: visitor.idType,
      visitorIdNumber: visitor.idNumber,
      visitorCompany: visitor.company,
      visitorPhone: visitor.phone,
      siteId: BAHRAIN.siteId,
      requestorId,
      hostId,
      purpose: PURPOSES.admin_visit[i],
      startDate: futureDate(i + 1),
      endDate: futureDate(i + 3),
      startTime: '08:00',
      endTime: '17:00',
      categoryId: REQUEST_TYPES.ADMIN_VISIT.categoryId,
      selectedTypeIds: JSON.stringify([REQUEST_TYPES.ADMIN_VISIT.id]),
      formData: JSON.stringify({
        requestor_name: 'Test Requestor',
        country: String(BAHRAIN.countryId),
        city: String(BAHRAIN.cityId),
        site: String(BAHRAIN.siteId),
        zone: String(BAHRAIN.zoneId),
        area: String(BAHRAIN.areaId),
        host_user: String(hostId),
        full_name: visitor.name,
        nationality: visitor.nationality,
        id_type: visitor.idType,
        id_number: visitor.idNumber,
        company: visitor.company,
        job_title: visitor.jobTitle,
        mobile: visitor.phone,
        start_date: futureDate(i + 1),
        end_date: futureDate(i + 3),
        start_time: '08:00',
        end_time: '17:00',
      }),
    });
  }
  
  // 5 TEP requests
  for (let i = 0; i < 5; i++) {
    const visitor = VISITORS[i + 5];
    const requestorId = REQUESTOR_IDS[(i + 1) % REQUESTOR_IDS.length];
    const hostId = HOST_IDS[(i + 1) % HOST_IDS.length];
    requests.push({
      requestNumber: generateRequestNumber(),
      type: 'tep',
      status: 'pending_approval',
      visitorName: visitor.name,
      visitorIdType: visitor.idType,
      visitorIdNumber: visitor.idNumber,
      visitorCompany: visitor.company,
      visitorPhone: visitor.phone,
      siteId: BAHRAIN.siteId,
      requestorId,
      hostId,
      purpose: PURPOSES.tep[i],
      startDate: futureDate(i + 2),
      endDate: futureDate(i + 10),
      startTime: '07:00',
      endTime: '19:00',
      categoryId: REQUEST_TYPES.TEP.categoryId,
      selectedTypeIds: JSON.stringify([REQUEST_TYPES.TEP.id]),
      formData: JSON.stringify({
        requestor_name: 'Test Requestor',
        purpose: PURPOSES.tep[i],
        target_room: `Hall ${String.fromCharCode(65 + i)}`,
        host_name: String(hostId),
        country: String(BAHRAIN.countryId),
        city: String(BAHRAIN.cityId),
        site: String(BAHRAIN.siteId),
        Zone: String(BAHRAIN.zoneId),
        area: String(BAHRAIN.areaId),
        host_user: String(hostId),
        full_name: visitor.name,
        nationality: visitor.nationality,
        id_type: visitor.idType,
        id_number: visitor.idNumber,
        company: visitor.company,
        job_title: visitor.jobTitle,
        mobile: visitor.phone,
        start_date: futureDate(i + 2),
        end_date: futureDate(i + 10),
      }),
    });
  }
  
  // 5 Work Permission requests
  for (let i = 0; i < 5; i++) {
    const visitor = VISITORS[i % VISITORS.length];
    const requestorId = REQUESTOR_IDS[(i + 2) % REQUESTOR_IDS.length];
    const hostId = HOST_IDS[(i + 2) % HOST_IDS.length];
    requests.push({
      requestNumber: generateRequestNumber(),
      type: 'work_permit',
      status: 'pending_approval',
      visitorName: visitor.name,
      visitorIdType: visitor.idType,
      visitorIdNumber: visitor.idNumber,
      visitorCompany: visitor.company,
      visitorPhone: visitor.phone,
      siteId: BAHRAIN.siteId,
      requestorId,
      hostId,
      purpose: PURPOSES.work_permit[i],
      startDate: futureDate(i + 1),
      endDate: futureDate(i + 5),
      startTime: '06:00',
      endTime: '18:00',
      categoryId: REQUEST_TYPES.WORK_PERMISSION.categoryId,
      selectedTypeIds: JSON.stringify([REQUEST_TYPES.WORK_PERMISSION.id]),
      formData: JSON.stringify({
        requestor_name: 'Test Requestor',
        country: String(BAHRAIN.countryId),
        city: String(BAHRAIN.cityId),
        site: String(BAHRAIN.siteId),
        zone: String(BAHRAIN.zoneId),
        area: String(BAHRAIN.areaId),
        full_name: visitor.name,
        nationality: visitor.nationality,
        id_type: visitor.idType,
        id_number: visitor.idNumber,
        company: visitor.company,
        job_title: visitor.jobTitle,
        mobile: visitor.phone,
        start_date: futureDate(i + 1),
        end_date: futureDate(i + 5),
      }),
    });
  }
  
  // 5 Material/Vehicle (MHV) requests
  for (let i = 0; i < 5; i++) {
    const visitor = VISITORS[(i + 3) % VISITORS.length];
    const requestorId = REQUESTOR_IDS[(i + 3) % REQUESTOR_IDS.length];
    const hostId = HOST_IDS[i % HOST_IDS.length];
    requests.push({
      requestNumber: generateRequestNumber(),
      type: 'material_entry',
      status: 'pending_approval',
      visitorName: visitor.name,
      visitorIdType: visitor.idType,
      visitorIdNumber: visitor.idNumber,
      visitorCompany: visitor.company,
      visitorPhone: visitor.phone,
      siteId: BAHRAIN.siteId,
      requestorId,
      hostId,
      purpose: PURPOSES.material_entry[i],
      startDate: futureDate(i + 1),
      endDate: futureDate(i + 2),
      startTime: '09:00',
      endTime: '16:00',
      categoryId: REQUEST_TYPES.MHV.categoryId,
      selectedTypeIds: JSON.stringify([REQUEST_TYPES.MHV.id]),
      formData: JSON.stringify({
        requestor_name: 'Test Requestor',
        country: String(BAHRAIN.countryId),
        city: String(BAHRAIN.cityId),
        site: String(BAHRAIN.siteId),
        zone: String(BAHRAIN.zoneId),
        area: String(BAHRAIN.areaId),
        full_name: visitor.name,
        nationality: visitor.nationality,
        id_type: visitor.idType,
        id_number: visitor.idNumber,
        company: visitor.company,
        job_title: visitor.jobTitle,
        mobile: visitor.phone,
        start_date: futureDate(i + 1),
        end_date: futureDate(i + 2),
      }),
    });
  }
  
  return requests;
}

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL);
  
  const testRequests = buildTestRequests();
  console.log(`Creating ${testRequests.length} test requests on Bahrain Data Centre...`);
  
  const createdIds = [];
  
  for (const req of testRequests) {
    try {
      const [result] = await conn.query(
        `INSERT INTO requests (requestNumber, type, status, visitorName, visitorIdType, visitorIdNumber, visitorCompany, visitorPhone, siteId, requestorId, hostId, purpose, startDate, endDate, startTime, endTime, categoryId, selectedTypeIds, formData) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.requestNumber, req.type, req.status,
          req.visitorName, req.visitorIdType, req.visitorIdNumber,
          req.visitorCompany, req.visitorPhone,
          req.siteId, req.requestorId, req.hostId,
          req.purpose, req.startDate, req.endDate,
          req.startTime, req.endTime,
          req.categoryId, req.selectedTypeIds, req.formData,
        ]
      );
      
      const requestId = result.insertId;
      createdIds.push({ id: requestId, number: req.requestNumber, type: req.type });
      console.log(`  Created ${req.requestNumber} (${req.type}) - ID: ${requestId}`);
    } catch (err) {
      console.error(`  Failed to create ${req.requestNumber}: ${err.message}`);
    }
  }
  
  console.log(`\nCreated ${createdIds.length} requests. Now starting workflows...`);
  
  // Now start workflows for each request using the workflow engine
  // We need to find the Bahrain workflow and create approval instances + tasks
  
  // Get the Bahrain workflow
  const [workflows] = await conn.query(
    `SELECT aw.id, aw.name FROM approvalWorkflows aw 
     JOIN workflowConditions wc ON wc.workflowId = aw.id 
     WHERE wc.conditionType = 'site_id' AND wc.conditionValue = '30001' AND aw.isActive = 1 
     LIMIT 1`
  );
  
  if (workflows.length === 0) {
    console.error('No Bahrain workflow found!');
    await conn.end();
    return;
  }
  
  const workflowId = workflows[0].id;
  console.log(`Using Bahrain Workflow: ${workflows[0].name} (ID: ${workflowId})`);
  
  // Get the first stage
  const [stages] = await conn.query(
    `SELECT id, stageName, stageOrder FROM approvalStages WHERE workflowId = ? ORDER BY stageOrder`,
    [workflowId]
  );
  
  if (stages.length === 0) {
    console.error('No stages found for Bahrain workflow!');
    await conn.end();
    return;
  }
  
  console.log(`Workflow stages: ${stages.map(s => `${s.stageOrder}. ${s.stageName}`).join(', ')}`);
  
  const firstStageId = stages[0].id;
  
  // Get approvers for first stage
  const [approvers] = await conn.query(
    `SELECT sa.id, sa.approverType, sa.approverReference, u.name as userName 
     FROM stageApprovers sa 
     LEFT JOIN users u ON sa.approverReference = CAST(u.id AS CHAR)
     WHERE sa.stageId = ?`,
    [firstStageId]
  );
  
  console.log(`First stage approvers: ${approvers.map(a => a.userName || a.approverReference).join(', ')}`);
  
  // Create approval instances and tasks for each request
  for (const req of createdIds) {
    try {
      // Create approval instance
      const [instResult] = await conn.query(
        `INSERT INTO approvalInstances (requestId, requestType, workflowId, currentStageId, status, startedAt) VALUES (?, ?, ?, ?, 'in_progress', NOW())`,
        [req.id, req.type, workflowId, firstStageId]
      );
      
      const instanceId = instResult.insertId;
      
      // Create tasks for each approver
      for (const approver of approvers) {
        const userId = parseInt(approver.approverReference);
        if (isNaN(userId)) continue;
        
        await conn.query(
          `INSERT INTO approvalTasks (instanceId, stageId, assignedTo, assignedVia, status) VALUES (?, ?, ?, 'direct', 'pending')`,
          [instanceId, firstStageId, userId]
        );
      }
      
      // Record history
      await conn.query(
        `INSERT INTO approvalHistory (instanceId, actionType, actionBy, details) VALUES (?, 'workflow_started', ?, ?)`,
        [instanceId, req.id, JSON.stringify({ workflowName: workflows[0].name, firstStageName: stages[0].stageName })]
      );
      
      console.log(`  Started workflow for ${req.number} (instance: ${instanceId})`);
    } catch (err) {
      console.error(`  Failed to start workflow for ${req.number}: ${err.message}`);
    }
  }
  
  // Final count
  const [finalCount] = await conn.query('SELECT COUNT(*) as cnt FROM requests WHERE siteId = 30001');
  console.log(`\nTotal Bahrain requests: ${finalCount[0].cnt}`);
  
  const [pendingCount] = await conn.query(
    `SELECT COUNT(*) as cnt FROM approvalTasks at 
     JOIN approvalInstances ai ON at.instanceId = ai.id 
     JOIN requests r ON ai.requestId = r.id 
     WHERE r.siteId = 30001 AND at.status = 'pending'`
  );
  console.log(`Pending approval tasks for Bahrain: ${pendingCount[0].cnt}`);
  
  await conn.end();
  console.log('\nDone!');
}

main().catch(console.error);

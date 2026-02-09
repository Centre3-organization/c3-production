import mysql from 'mysql2/promise';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Helper to hash passwords
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Generate unique openId
function generateOpenId() {
  return crypto.randomBytes(16).toString('hex');
}

console.log("=== Creating Bahrain User Accounts ===\n");

const users = [
  {
    name: "Ahmed",
    firstName: "Ahmed",
    lastName: "",
    email: "ahmed@c3.com",
    role: "user",
    jobTitle: "Security Officer",
    userType: "centre3_employee",
  },
  {
    name: "George",
    firstName: "George",
    lastName: "",
    email: "george@c3.com",
    role: "user",
    jobTitle: "Security Officer",
    userType: "centre3_employee",
  },
  {
    name: "Alica",
    firstName: "Alica",
    lastName: "",
    email: "security@bahrainc3.com",
    role: "user",
    jobTitle: "Security Manager",
    userType: "centre3_employee",
  },
  {
    name: "Head of Admin",
    firstName: "Head of",
    lastName: "Admin",
    email: "admin@c3bahrain.com",
    role: "user",
    jobTitle: "Head of Admin",
    userType: "centre3_employee",
  },
  {
    name: "Head of Security",
    firstName: "Head of",
    lastName: "Security",
    email: "hos@bahrainc3.com",
    role: "user",
    jobTitle: "Head of Security",
    userType: "centre3_employee",
  },
];

const createdUserIds = {};
const defaultPassword = hashPassword("Centre3@2026");

for (const user of users) {
  // Check if user already exists
  const [existing] = await conn.execute(
    `SELECT id, name, email FROM users WHERE email = ?`,
    [user.email]
  );

  if (existing.length > 0) {
    console.log(`User ${user.name} (${user.email}) already exists with id=${existing[0].id}`);
    createdUserIds[user.email] = existing[0].id;
    continue;
  }

  const openId = generateOpenId();
  const [result] = await conn.execute(
    `INSERT INTO users (openId, name, firstName, lastName, email, passwordHash, loginMethod, role, status, userType, jobTitle)
     VALUES (?, ?, ?, ?, ?, ?, 'password', ?, 'active', ?, ?)`,
    [openId, user.name, user.firstName, user.lastName, user.email, defaultPassword, user.role, user.userType, user.jobTitle]
  );

  createdUserIds[user.email] = result.insertId;
  console.log(`Created user: ${user.name} (${user.email}) → id=${result.insertId}`);
}

console.log("\nUser IDs:", createdUserIds);

// ============================================================================
// Create Bahrain Workflow
// ============================================================================
console.log("\n=== Creating Bahrain Workflow ===\n");

// Check if workflow already exists
const [existingWorkflow] = await conn.execute(
  `SELECT id FROM approvalWorkflows WHERE name = 'Bahrain Workflow'`
);

let workflowId;

if (existingWorkflow.length > 0) {
  workflowId = existingWorkflow[0].id;
  console.log(`Bahrain Workflow already exists with id=${workflowId}`);
} else {
  // Create the workflow - no specific processType so it can handle all types
  // Set it as non-default so it doesn't override the Standard Approval Process
  const [wfResult] = await conn.execute(
    `INSERT INTO approvalWorkflows (name, description, processType, isActive, isDefault, priority)
     VALUES ('Bahrain Workflow', 'Approval workflow for Bahrain Data Centre sites', NULL, 1, 0, 10)`,
  );
  workflowId = wfResult.insertId;
  console.log(`Created Bahrain Workflow → id=${workflowId}`);
}

// ============================================================================
// Create Workflow Stages
// ============================================================================
console.log("\n=== Creating Workflow Stages ===\n");

// Check if stages already exist
const [existingStages] = await conn.execute(
  `SELECT id, stageName, stageOrder FROM approvalStages WHERE workflowId = ? ORDER BY stageOrder`,
  [workflowId]
);

if (existingStages.length > 0) {
  console.log("Stages already exist:", existingStages.map(s => `${s.stageOrder}: ${s.stageName}`));
} else {
  // Stage 1: Security Officer (Ahmed + George) - approval mode "any"
  const [stage1Result] = await conn.execute(
    `INSERT INTO approvalStages (workflowId, stageOrder, stageName, stageType, approvalMode, requiredApprovals, canReject, canRequestInfo)
     VALUES (?, 1, 'Security Officer Review', 'individual', 'any', 1, 1, 1)`,
    [workflowId]
  );
  const stage1Id = stage1Result.insertId;
  console.log(`Created Stage 1: Security Officer Review → id=${stage1Id}`);

  // Add Ahmed and George as approvers for Stage 1
  await conn.execute(
    `INSERT INTO stageApprovers (stageId, approverType, approverReference, priority)
     VALUES (?, 'user', ?, 1)`,
    [stage1Id, String(createdUserIds["ahmed@c3.com"])]
  );
  await conn.execute(
    `INSERT INTO stageApprovers (stageId, approverType, approverReference, priority)
     VALUES (?, 'user', ?, 2)`,
    [stage1Id, String(createdUserIds["george@c3.com"])]
  );
  console.log(`  Added approvers: Ahmed (id=${createdUserIds["ahmed@c3.com"]}), George (id=${createdUserIds["george@c3.com"]})`);

  // Stage 2: Security Manager (Alica)
  const [stage2Result] = await conn.execute(
    `INSERT INTO approvalStages (workflowId, stageOrder, stageName, stageType, approvalMode, requiredApprovals, canReject, canRequestInfo)
     VALUES (?, 2, 'Security Manager Approval', 'individual', 'any', 1, 1, 1)`,
    [workflowId]
  );
  const stage2Id = stage2Result.insertId;
  console.log(`Created Stage 2: Security Manager Approval → id=${stage2Id}`);

  await conn.execute(
    `INSERT INTO stageApprovers (stageId, approverType, approverReference, priority)
     VALUES (?, 'user', ?, 1)`,
    [stage2Id, String(createdUserIds["security@bahrainc3.com"])]
  );
  console.log(`  Added approver: Alica (id=${createdUserIds["security@bahrainc3.com"]})`);

  // Stage 3: Final Approver - Head of Admin for admin requests, Head of Security for all others
  // Since we can't do conditional routing per request type within a single stage easily,
  // we'll add BOTH as approvers with approval mode "any" - the correct person will approve
  const [stage3Result] = await conn.execute(
    `INSERT INTO approvalStages (workflowId, stageOrder, stageName, stageType, approvalMode, requiredApprovals, canReject, canRequestInfo)
     VALUES (?, 3, 'Final Approval', 'individual', 'any', 1, 1, 1)`,
    [workflowId]
  );
  const stage3Id = stage3Result.insertId;
  console.log(`Created Stage 3: Final Approval → id=${stage3Id}`);

  // Add Head of Admin
  await conn.execute(
    `INSERT INTO stageApprovers (stageId, approverType, approverReference, priority)
     VALUES (?, 'user', ?, 1)`,
    [stage3Id, String(createdUserIds["admin@c3bahrain.com"])]
  );
  // Add Head of Security
  await conn.execute(
    `INSERT INTO stageApprovers (stageId, approverType, approverReference, priority)
     VALUES (?, 'user', ?, 2)`,
    [stage3Id, String(createdUserIds["hos@bahrainc3.com"])]
  );
  console.log(`  Added approvers: Head of Admin (id=${createdUserIds["admin@c3bahrain.com"]}), Head of Security (id=${createdUserIds["hos@bahrainc3.com"]})`);
}

// ============================================================================
// Add workflow condition: site = Bahrain sites
// ============================================================================
console.log("\n=== Setting Workflow Conditions ===\n");

// Check for Bahrain sites
const [bahrainSites] = await conn.execute(
  `SELECT id, name FROM sites WHERE name LIKE '%Bahrain%' OR name LIKE '%bahrain%'`
);

if (bahrainSites.length > 0) {
  console.log("Found Bahrain sites:", bahrainSites.map(s => `${s.id}: ${s.name}`));
  
  // Add site conditions for each Bahrain site
  for (const site of bahrainSites) {
    const [existingCondition] = await conn.execute(
      `SELECT id FROM workflowConditions WHERE workflowId = ? AND conditionType = 'siteId' AND conditionValue = ?`,
      [workflowId, String(site.id)]
    );
    
    if (existingCondition.length === 0) {
      await conn.execute(
        `INSERT INTO workflowConditions (workflowId, conditionType, conditionValue)
         VALUES (?, 'siteId', ?)`,
        [workflowId, String(site.id)]
      );
      console.log(`Added site condition: ${site.name} (id=${site.id})`);
    } else {
      console.log(`Site condition already exists for: ${site.name}`);
    }
  }
} else {
  console.log("No Bahrain sites found. The workflow will need site conditions added later.");
  console.log("Listing all sites for reference:");
  const [allSites] = await conn.execute(`SELECT id, name FROM sites WHERE status = 'active' ORDER BY name`);
  console.log(allSites.map(s => `  ${s.id}: ${s.name}`).join('\n'));
}

// ============================================================================
// Verification
// ============================================================================
console.log("\n=== Verification ===\n");

const [verifyWorkflow] = await conn.execute(
  `SELECT id, name, processType, isActive, isDefault, priority FROM approvalWorkflows WHERE id = ?`,
  [workflowId]
);
console.log("Workflow:", JSON.stringify(verifyWorkflow[0], null, 2));

const [verifyStages] = await conn.execute(
  `SELECT id, stageName, stageOrder, approvalMode FROM approvalStages WHERE workflowId = ? ORDER BY stageOrder`,
  [workflowId]
);
console.log("\nStages:");
for (const stage of verifyStages) {
  console.log(`  Stage ${stage.stageOrder}: ${stage.stageName} (mode: ${stage.approvalMode})`);
  
  const [approvers] = await conn.execute(
    `SELECT sa.approverType, sa.approverReference, u.name, u.email
     FROM stageApprovers sa
     LEFT JOIN users u ON u.id = CAST(sa.approverReference AS UNSIGNED)
     WHERE sa.stageId = ?
     ORDER BY sa.priority`,
    [stage.id]
  );
  for (const a of approvers) {
    console.log(`    → ${a.name} (${a.email}) [${a.approverType}]`);
  }
}

const [verifyConditions] = await conn.execute(
  `SELECT conditionType, conditionValue FROM workflowConditions WHERE workflowId = ?`,
  [workflowId]
);
console.log("\nConditions:", verifyConditions.length > 0 ? JSON.stringify(verifyConditions) : "None (applies to all sites)");

await conn.end();
console.log("\n✅ Bahrain Workflow setup complete!");

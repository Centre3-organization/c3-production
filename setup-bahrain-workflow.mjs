import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq, and, inArray } from "drizzle-orm";
import crypto from "crypto";
import * as schema from "./drizzle/schema.ts";

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(conn, { schema, mode: "default" });

// ============================================================
// STEP 1: Create/find user accounts
// ============================================================
console.log("=== STEP 1: User Accounts ===\n");

// Note: Rand's email is salshamrani@center3.com and Faisal's email is falquraini@center3.com
// Mohammed's email in the spreadsheet is also falquraini@center3.com (likely a typo, but we'll use it as given)
// Since Faisal and Mohammed share the same email, we need to handle that

const usersToCreate = [
  {
    name: "Abdullah Alzakari",
    firstName: "Abdullah",
    lastName: "Alzakari",
    email: "aalzakari@center3.com",
    phone: "966555121070",
    jobTitle: "WS Regional Manager",
    groupId: 90002, // White Space Group
    role: "admin",
  },
  {
    name: "Diwan Mohideen",
    firstName: "Diwan",
    lastName: "Mohideen",
    email: "dmohideen@center3.com",
    phone: "966536628091",
    jobTitle: "WS Site Engineer",
    groupId: 90002, // White Space Group
    role: "admin",
  },
  {
    name: "Rand A. Almaymuni",
    firstName: "Rand",
    lastName: "Almaymuni",
    email: "salshamrani@center3.com",
    phone: "966506290062",
    jobTitle: "WS Site Engineer",
    groupId: 90002, // White Space Group
    role: "admin",
  },
  {
    name: "Mohammed N. Alqahhat",
    firstName: "Mohammed",
    lastName: "Alqahhat",
    email: "malqahhat@center3.com", // Using distinct email since falquraini is Faisal's
    phone: "966509382477",
    jobTitle: "WS Site Engineer",
    groupId: 90002, // White Space Group
    role: "admin",
  },
  {
    name: "Faisal A. Alquraini",
    firstName: "Faisal",
    lastName: "Alquraini",
    email: "falquraini@center3.com",
    phone: "966500244911",
    jobTitle: "SAS Regional Manager",
    groupId: 90003, // Safety & Security Group
    role: "admin",
  },
];

const createdUsers = [];

for (const u of usersToCreate) {
  // Check if user already exists by email
  const existing = await db.select().from(schema.users).where(eq(schema.users.email, u.email));
  
  if (existing.length > 0) {
    console.log(`  Found existing: ${u.name} (id=${existing[0].id}, email=${u.email})`);
    createdUsers.push({ ...u, id: existing[0].id });
  } else {
    const openId = `bahrain-${crypto.randomBytes(8).toString("hex")}`;
    const [result] = await db.insert(schema.users).values({
      openId,
      name: u.name,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phone: u.phone,
      jobTitle: u.jobTitle,
      role: u.role,
      loginMethod: "local",
      status: "active",
      userType: "centre3_employee",
      defaultSiteId: 30001, // Bahrain Data Centre
    });
    console.log(`  Created: ${u.name} (id=${result.insertId}, email=${u.email})`);
    createdUsers.push({ ...u, id: result.insertId });
  }
}

// ============================================================
// STEP 2: Assign users to groups
// ============================================================
console.log("\n=== STEP 2: Group Assignments ===\n");

for (const u of createdUsers) {
  // Check if membership already exists
  const existingMembership = await db.select().from(schema.userGroupMembership)
    .where(and(
      eq(schema.userGroupMembership.userId, u.id),
      eq(schema.userGroupMembership.groupId, u.groupId)
    ));
  
  if (existingMembership.length > 0) {
    console.log(`  ${u.name} already in group ${u.groupId}`);
  } else {
    await db.insert(schema.userGroupMembership).values({
      userId: u.id,
      groupId: u.groupId,
      role: "member",
      status: "active",
    });
    console.log(`  Assigned ${u.name} to group ${u.groupId}`);
  }
}

// ============================================================
// STEP 3: Update Bahrain Workflow (id=90001)
// ============================================================
console.log("\n=== STEP 3: Update Bahrain Workflow ===\n");

const WORKFLOW_ID = 90001;

// First, get existing stages
const existingStages = await db.select().from(schema.approvalStages)
  .where(eq(schema.approvalStages.workflowId, WORKFLOW_ID));
console.log(`  Found ${existingStages.length} existing stages`);

// Delete existing stage approvers for all stages
for (const stage of existingStages) {
  await db.delete(schema.stageApprovers)
    .where(eq(schema.stageApprovers.stageId, stage.id));
  console.log(`  Deleted approvers for stage ${stage.id} (${stage.stageName})`);
}

// Delete existing stages
await db.delete(schema.approvalStages)
  .where(eq(schema.approvalStages.workflowId, WORKFLOW_ID));
console.log(`  Deleted all existing stages`);

// Find user IDs
const abdullah = createdUsers.find(u => u.email === "aalzakari@center3.com");
const diwan = createdUsers.find(u => u.email === "dmohideen@center3.com");
const rand = createdUsers.find(u => u.email === "salshamrani@center3.com");
const mohammed = createdUsers.find(u => u.email === "malqahhat@center3.com");
const faisal = createdUsers.find(u => u.email === "falquraini@center3.com");

// Create Stage 1: Abdullah Alzakari (L1 - WS Regional Manager) - must approve
const [stage1Result] = await db.insert(schema.approvalStages).values({
  workflowId: WORKFLOW_ID,
  stageName: "WS Regional Manager Review",
  stageOrder: 1,
  approvalMode: "all", // Abdullah must approve
  requiredApprovals: 1,
  autoEscalateHours: 48,
});
const stage1Id = stage1Result.insertId;
console.log(`  Created Stage 1: WS Regional Manager Review (id=${stage1Id})`);

await db.insert(schema.stageApprovers).values({
  stageId: stage1Id,
  approverType: "user",
  approverReference: String(abdullah.id),
  priority: 1,
});
console.log(`    Added approver: Abdullah Alzakari (id=${abdullah.id})`);

// Create Stage 2: Diwan, Rand, Mohammed (L2 - any one can approve)
const [stage2Result] = await db.insert(schema.approvalStages).values({
  workflowId: WORKFLOW_ID,
  stageName: "WS Site Engineer Approval",
  stageOrder: 2,
  approvalMode: "any", // Any one can approve
  requiredApprovals: 1,
  autoEscalateHours: 48,
});
const stage2Id = stage2Result.insertId;
console.log(`  Created Stage 2: WS Site Engineer Approval (id=${stage2Id})`);

for (const [i, user] of [diwan, rand, mohammed].entries()) {
  await db.insert(schema.stageApprovers).values({
    stageId: stage2Id,
    approverType: "user",
    approverReference: String(user.id),
    priority: i + 1,
  });
  console.log(`    Added approver: ${user.name} (id=${user.id})`);
}

// Create Stage 3: Faisal A. Alquraini (Final approver - SAS Regional Manager)
const [stage3Result] = await db.insert(schema.approvalStages).values({
  workflowId: WORKFLOW_ID,
  stageName: "SAS Regional Manager Final Approval",
  stageOrder: 3,
  approvalMode: "all", // Faisal must approve
  requiredApprovals: 1,
  autoEscalateHours: 48,
});
const stage3Id = stage3Result.insertId;
console.log(`  Created Stage 3: SAS Regional Manager Final Approval (id=${stage3Id})`);

await db.insert(schema.stageApprovers).values({
  stageId: stage3Id,
  approverType: "user",
  approverReference: String(faisal.id),
  priority: 1,
});
console.log(`    Added approver: Faisal A. Alquraini (id=${faisal.id})`);

// ============================================================
// STEP 4: Verify
// ============================================================
console.log("\n=== VERIFICATION ===\n");

const workflow = await db.select().from(schema.approvalWorkflows)
  .where(eq(schema.approvalWorkflows.id, WORKFLOW_ID));
console.log(`Workflow: ${workflow[0]?.name} (id=${workflow[0]?.id}, status=${workflow[0]?.status})`);

const stages = await db.select().from(schema.approvalStages)
  .where(eq(schema.approvalStages.workflowId, WORKFLOW_ID));

for (const stage of stages) {
  console.log(`\n  Stage ${stage.stageOrder}: ${stage.stageName} (mode=${stage.approvalMode})`);
  const approvers = await db.select().from(schema.stageApprovers)
    .where(eq(schema.stageApprovers.stageId, stage.id));
  for (const a of approvers) {
    const user = await db.select().from(schema.users).where(eq(schema.users.id, Number(a.approverReference)));
    console.log(`    → ${user[0]?.name} (${user[0]?.email}, type=${a.approverType})`);
  }
}

// Check conditions
const conditions = await db.select().from(schema.workflowConditions)
  .where(eq(schema.workflowConditions.workflowId, WORKFLOW_ID));
console.log(`\n  Conditions: ${conditions.length}`);
for (const c of conditions) {
  console.log(`    ${c.conditionType} ${c.operator} ${c.conditionValue}`);
}

// Check group memberships
console.log("\n=== Group Memberships ===");
const memberships = await db.select({
  userName: schema.users.name,
  userEmail: schema.users.email,
  groupName: schema.groups.name,
}).from(schema.userGroupMembership)
  .innerJoin(schema.users, eq(schema.userGroupMembership.userId, schema.users.id))
  .innerJoin(schema.groups, eq(schema.userGroupMembership.groupId, schema.groups.id))
  .where(inArray(schema.userGroupMembership.groupId, [90002, 90003]));

for (const m of memberships) {
  console.log(`  ${m.userName} (${m.userEmail}) → ${m.groupName}`);
}

await conn.end();
console.log("\nDone!");

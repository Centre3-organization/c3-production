import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq } from "drizzle-orm";
import * as schema from "./drizzle/schema.ts";

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(conn, { schema, mode: "default" });

// 1. Find Centre3 Internal group
const allGroups = await db.select().from(schema.groups);
console.log("All existing groups:");
allGroups.forEach(g => console.log(`  id=${g.id}, name="${g.name}", type=${g.groupType}, parentGroupId=${g.parentGroupId}, status=${g.status}`));

const centre3Internal = allGroups.find(g => g.name.toLowerCase().includes("centre3") && g.groupType === "internal");
if (!centre3Internal) {
  console.log("\nCentre3 Internal group not found. Creating it...");
  const [result] = await db.insert(schema.groups).values({
    name: "Centre3 Internal",
    groupType: "internal",
    parentGroupId: null,
    description: "Centre3 Internal organization",
    status: "active",
  });
  const centre3Id = result.insertId;
  console.log(`Created Centre3 Internal group with id=${centre3Id}`);
  
  // Create Bahrain under it
  const [bahrainResult] = await db.insert(schema.groups).values({
    name: "Bahrain",
    groupType: "internal",
    parentGroupId: centre3Id,
    description: "Bahrain Data Centre operations",
    status: "active",
  });
  const bahrainId = bahrainResult.insertId;
  console.log(`Created Bahrain group with id=${bahrainId}`);

  // Create White Space Group and Safety & Security Group under Bahrain
  const [wsResult] = await db.insert(schema.groups).values({
    name: "White Space Group",
    groupType: "internal",
    parentGroupId: bahrainId,
    description: "White Space operations group under Bahrain",
    status: "active",
  });
  console.log(`Created White Space Group with id=${wsResult.insertId}`);

  const [sasResult] = await db.insert(schema.groups).values({
    name: "Safety & Security Group",
    groupType: "internal",
    parentGroupId: bahrainId,
    description: "Safety and Security operations group under Bahrain",
    status: "active",
  });
  console.log(`Created Safety & Security Group with id=${sasResult.insertId}`);
} else {
  console.log(`\nFound Centre3 Internal: id=${centre3Internal.id}`);

  // Check if Bahrain already exists
  const existingBahrain = allGroups.find(g => g.name === "Bahrain" && g.parentGroupId === centre3Internal.id);
  let bahrainId;
  if (existingBahrain) {
    bahrainId = existingBahrain.id;
    console.log(`Bahrain group already exists: id=${bahrainId}`);
  } else {
    const [bahrainResult] = await db.insert(schema.groups).values({
      name: "Bahrain",
      groupType: "internal",
      parentGroupId: centre3Internal.id,
      description: "Bahrain Data Centre operations",
      status: "active",
    });
    bahrainId = bahrainResult.insertId;
    console.log(`Created Bahrain group with id=${bahrainId}`);
  }

  // Check/create White Space Group
  const existingWS = allGroups.find(g => g.name === "White Space Group" && g.parentGroupId === bahrainId);
  if (existingWS) {
    console.log(`White Space Group already exists: id=${existingWS.id}`);
  } else {
    const [wsResult] = await db.insert(schema.groups).values({
      name: "White Space Group",
      groupType: "internal",
      parentGroupId: bahrainId,
      description: "White Space operations group under Bahrain",
      status: "active",
    });
    console.log(`Created White Space Group with id=${wsResult.insertId}`);
  }

  // Check/create Safety & Security Group
  const existingSAS = allGroups.find(g => g.name === "Safety & Security Group" && g.parentGroupId === bahrainId);
  if (existingSAS) {
    console.log(`Safety & Security Group already exists: id=${existingSAS.id}`);
  } else {
    const [sasResult] = await db.insert(schema.groups).values({
      name: "Safety & Security Group",
      groupType: "internal",
      parentGroupId: bahrainId,
      description: "Safety and Security operations group under Bahrain",
      status: "active",
    });
    console.log(`Created Safety & Security Group with id=${sasResult.insertId}`);
  }
}

// Final verification
const finalGroups = await db.select().from(schema.groups);
console.log("\n=== Final Group Structure ===");
const printTree = (parentId, indent = "") => {
  const children = finalGroups.filter(g => g.parentGroupId === parentId);
  children.forEach(g => {
    console.log(`${indent}├── [${g.id}] ${g.name} (${g.groupType}, ${g.status})`);
    printTree(g.id, indent + "│   ");
  });
};
// Print root groups
const roots = finalGroups.filter(g => !g.parentGroupId);
roots.forEach(g => {
  console.log(`[${g.id}] ${g.name} (${g.groupType}, ${g.status})`);
  printTree(g.id, "  ");
});

await conn.end();

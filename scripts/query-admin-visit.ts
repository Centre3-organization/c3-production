import { getDb } from "../server/infra/db/connection";
import { formSections, formFields, requestTypes } from "../drizzle/schema";
import { eq } from "drizzle-orm";

async function main() {
  const db = await getDb();
  if (!db) {
    console.log("Database connection failed");
    process.exit(1);
  }

  // Get Admin Visit request type
  const adminVisitResults = await db.select().from(requestTypes).where(eq(requestTypes.code, "ADMIN_VISIT"));
  const adminVisit = adminVisitResults[0];

  if (!adminVisit) {
    console.log("Admin Visit request type not found");
    process.exit(1);
  }

  console.log("Admin Visit Request Type:", adminVisit.id, adminVisit.name);

  // Get all sections
  const sections = await db.select().from(formSections)
    .where(eq(formSections.requestTypeId, adminVisit.id))
    .orderBy(formSections.displayOrder);

  console.log("\n=== SECTIONS ===");
  for (const section of sections) {
    console.log(`\n${section.displayOrder}. ${section.name} (${section.code}) - ID: ${section.id}, Repeatable: ${section.isRepeatable}`);
    
    // Get fields for this section
    const fields = await db.select().from(formFields)
      .where(eq(formFields.sectionId, section.id))
      .orderBy(formFields.displayOrder);

    for (const field of fields) {
      console.log(`   - ${field.name} (${field.code}): ${field.fieldType}, source: ${field.optionsSource || 'static'}, required: ${field.isRequired}`);
    }
  }

  process.exit(0);
}

main().catch(console.error);

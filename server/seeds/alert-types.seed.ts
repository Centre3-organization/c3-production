import { getDb } from "../db";
import { securityAlertTypes } from "../../drizzle/schema";

export async function seedAlertTypes(createdByUserId: number = 1) {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    return;
  }
  const defaultAlertTypes: Array<{ name: string; description: string; category: "breach" | "impact" | "status" | "view" | "action"; severity: "low" | "medium" | "high" | "critical" }> = [
    {
      name: "Breach Detection",
      description: "Alert when unauthorized access or breach is detected",
      category: "breach",
      severity: "critical"
    },
    {
      name: "Impact Assessment",
      description: "Alert for potential impact on facility or operations",
      category: "impact",
      severity: "high"
    },
    {
      name: "Status Change",
      description: "Alert when critical status changes occur",
      category: "status",
      severity: "medium"
    },
    {
      name: "Access View",
      description: "Alert when sensitive data is viewed or accessed",
      category: "view",
      severity: "medium"
    },
    {
      name: "Action Required",
      description: "Alert for actions that require immediate attention",
      category: "action",
      severity: "high"
    },
    {
      name: "Watchlist Match",
      description: "Alert when a visitor matches watchlist criteria",
      category: "breach",
      severity: "critical"
    },
    {
      name: "Multiple Denials",
      description: "Alert when multiple access denials occur",
      category: "breach",
      severity: "high"
    },
    {
      name: "Anomaly Detected",
      description: "Alert when unusual patterns or behaviors are detected",
      category: "breach",
      severity: "high"
    }
  ];

  for (const alertType of defaultAlertTypes) {
    try {
      await db.insert(securityAlertTypes).values({
        ...alertType,
        isActive: true,
        isSystem: true,
        createdBy: createdByUserId,
        createdAt: new Date(),
        updatedAt: new Date()
      }).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });
    } catch (error) {
      console.log(`Alert type '${alertType.name}' already exists or error: ${error}`);
    }
  }

  console.log("Alert types seeded successfully");
}

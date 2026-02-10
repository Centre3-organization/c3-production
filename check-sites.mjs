import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./drizzle/schema.ts";

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(conn, { schema, mode: "default" });

const sites = await db.select().from(schema.sites);
console.log("=== All Sites ===");
for (const s of sites) {
  console.log(`  id=${s.id}, name="${s.name}", code="${s.code}", status=${s.status}`);
}

await conn.end();

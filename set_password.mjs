import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  // Set password for admin user
  const password = "Centre3@Admin2025";
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);
  
  console.log("Password:", password);
  console.log("Hash:", passwordHash);
  
  // Update the database
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  await connection.execute(
    "UPDATE users SET passwordHash = ? WHERE email = ?",
    [passwordHash, "mohsiin@gmail.com"]
  );
  
  console.log("Password updated for mohsiin@gmail.com");
  
  // Verify
  const [rows] = await connection.execute(
    "SELECT id, email, passwordHash FROM users WHERE email = ?",
    ["mohsiin@gmail.com"]
  );
  console.log("User:", rows);
  
  await connection.end();
}

main().catch(console.error);

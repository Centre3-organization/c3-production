/**
 * Seed Script: Create Test Users and Approval Workflows
 * 
 * This script creates:
 * 1. 10 Centre3 internal users with different roles
 * 2. 5 Amazon users
 * 3. 5 Google Cloud users
 * 4. Approval workflows for Admin Visit scenarios
 */

import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

// Database connection from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

// Parse connection string
function parseConnectionString(url) {
  const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
  if (!match) throw new Error('Invalid DATABASE_URL format');
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4]),
    database: match[5],
    ssl: { rejectUnauthorized: true }
  };
}

// Centre3 Internal Users (10 users)
const centre3Users = [
  { email: 'securityofficer@centre3.com', firstName: 'Ahmed', lastName: 'Al-Security', jobTitle: 'Security Officer', systemRoleCode: 'security_officer' },
  { email: 'sitemanager@centre3.com', firstName: 'Mohammed', lastName: 'Al-Site', jobTitle: 'Site Manager', systemRoleCode: 'site_manager' },
  { email: 'securitymanager@centre3.com', firstName: 'Khalid', lastName: 'Al-Manager', jobTitle: 'Security Manager', systemRoleCode: 'security_manager' },
  { email: 'riyadhsecurityofficer@centre3.com', firstName: 'Faisal', lastName: 'Al-Riyadh', jobTitle: 'Riyadh Security Officer', systemRoleCode: 'security_officer' },
  { email: 'jaborofficer@centre3.com', firstName: 'Omar', lastName: 'Al-Jabor', jobTitle: 'Jabor Security Officer', systemRoleCode: 'security_officer' },
  { email: 'facilitymanager@centre3.com', firstName: 'Sultan', lastName: 'Al-Facility', jobTitle: 'Facility Manager', systemRoleCode: 'facility_manager' },
  { email: 'accesscontroller@centre3.com', firstName: 'Nasser', lastName: 'Al-Access', jobTitle: 'Access Controller', systemRoleCode: 'access_controller' },
  { email: 'shiftlead@centre3.com', firstName: 'Turki', lastName: 'Al-Shift', jobTitle: 'Shift Lead', systemRoleCode: 'shift_lead' },
  { email: 'dutymanager@centre3.com', firstName: 'Saad', lastName: 'Al-Duty', jobTitle: 'Duty Manager', systemRoleCode: 'duty_manager' },
  { email: 'operationsmanager@centre3.com', firstName: 'Abdulaziz', lastName: 'Al-Operations', jobTitle: 'Operations Manager', systemRoleCode: 'operations_manager' },
];

// Amazon Users (5 users)
const amazonUsers = [
  { email: 'user1@aws.com', firstName: 'John', lastName: 'Smith', jobTitle: 'Cloud Engineer', company: 'Amazon Web Services' },
  { email: 'user2@aws.com', firstName: 'Sarah', lastName: 'Johnson', jobTitle: 'Solutions Architect', company: 'Amazon Web Services' },
  { email: 'manager@aws.com', firstName: 'Michael', lastName: 'Brown', jobTitle: 'Technical Account Manager', company: 'Amazon Web Services' },
  { email: 'engineer@aws.com', firstName: 'Emily', lastName: 'Davis', jobTitle: 'DevOps Engineer', company: 'Amazon Web Services' },
  { email: 'admin@aws.com', firstName: 'David', lastName: 'Wilson', jobTitle: 'AWS Administrator', company: 'Amazon Web Services' },
];

// Google Cloud Users (5 users)
const googleUsers = [
  { email: 'user1@google.com', firstName: 'James', lastName: 'Anderson', jobTitle: 'Cloud Architect', company: 'Google Cloud' },
  { email: 'user2@google.com', firstName: 'Jennifer', lastName: 'Taylor', jobTitle: 'Site Reliability Engineer', company: 'Google Cloud' },
  { email: 'manager@google.com', firstName: 'Robert', lastName: 'Martinez', jobTitle: 'Customer Engineer Manager', company: 'Google Cloud' },
  { email: 'engineer@google.com', firstName: 'Lisa', lastName: 'Garcia', jobTitle: 'Platform Engineer', company: 'Google Cloud' },
  { email: 'admin@google.com', firstName: 'William', lastName: 'Lee', jobTitle: 'GCP Administrator', company: 'Google Cloud' },
];

async function main() {
  const config = parseConnectionString(DATABASE_URL);
  const connection = await mysql.createConnection(config);
  
  console.log('Connected to database');
  
  try {
    // Get existing system roles
    const [systemRoles] = await connection.execute('SELECT id, code, name FROM systemRoles');
    console.log('System Roles:', systemRoles.map(r => `${r.code} (${r.id})`).join(', '));
    
    const roleMap = {};
    systemRoles.forEach(r => roleMap[r.code] = r.id);
    
    // Get existing sites
    const [sites] = await connection.execute('SELECT id, name, code FROM sites');
    console.log('Sites:', sites.map(s => `${s.code} (${s.id})`).join(', '));
    
    // Hash password for all users
    const passwordHash = await bcrypt.hash('Test@123', 10);
    
    // Create Centre3 users
    console.log('\n--- Creating Centre3 Internal Users ---');
    const createdCentre3Users = [];
    for (const user of centre3Users) {
      const openId = randomUUID();
      const fullName = `${user.firstName} ${user.lastName}`;
      
      // Check if user already exists
      const [existing] = await connection.execute('SELECT id FROM users WHERE email = ?', [user.email]);
      if (existing.length > 0) {
        console.log(`  User ${user.email} already exists (ID: ${existing[0].id})`);
        createdCentre3Users.push({ ...user, id: existing[0].id });
        continue;
      }
      
      const [result] = await connection.execute(
        `INSERT INTO users (openId, name, firstName, lastName, email, passwordHash, loginMethod, role, userType, jobTitle, status) 
         VALUES (?, ?, ?, ?, ?, ?, 'password', 'user', 'centre3_employee', ?, 'active')`,
        [openId, fullName, user.firstName, user.lastName, user.email, passwordHash, user.jobTitle]
      );
      
      const userId = result.insertId;
      createdCentre3Users.push({ ...user, id: userId });
      console.log(`  Created: ${user.email} (ID: ${userId})`);
      
      // Assign system role if available
      if (user.systemRoleCode && roleMap[user.systemRoleCode]) {
        await connection.execute(
          `INSERT INTO userSystemRoles (userId, roleId, assignedBy, isActive) VALUES (?, ?, ?, true)
           ON DUPLICATE KEY UPDATE roleId = VALUES(roleId)`,
          [userId, roleMap[user.systemRoleCode], userId]
        );
        console.log(`    Assigned role: ${user.systemRoleCode}`);
      }
    }
    
    // Create Amazon users
    console.log('\n--- Creating Amazon Users ---');
    const createdAmazonUsers = [];
    for (const user of amazonUsers) {
      const openId = randomUUID();
      const fullName = `${user.firstName} ${user.lastName}`;
      
      const [existing] = await connection.execute('SELECT id FROM users WHERE email = ?', [user.email]);
      if (existing.length > 0) {
        console.log(`  User ${user.email} already exists (ID: ${existing[0].id})`);
        createdAmazonUsers.push({ ...user, id: existing[0].id });
        continue;
      }
      
      const [result] = await connection.execute(
        `INSERT INTO users (openId, name, firstName, lastName, email, passwordHash, loginMethod, role, userType, jobTitle, status) 
         VALUES (?, ?, ?, ?, ?, ?, 'password', 'user', 'client', ?, 'active')`,
        [openId, fullName, user.firstName, user.lastName, user.email, passwordHash, user.jobTitle]
      );
      
      createdAmazonUsers.push({ ...user, id: result.insertId });
      console.log(`  Created: ${user.email} (ID: ${result.insertId})`);
    }
    
    // Create Google users
    console.log('\n--- Creating Google Cloud Users ---');
    const createdGoogleUsers = [];
    for (const user of googleUsers) {
      const openId = randomUUID();
      const fullName = `${user.firstName} ${user.lastName}`;
      
      const [existing] = await connection.execute('SELECT id FROM users WHERE email = ?', [user.email]);
      if (existing.length > 0) {
        console.log(`  User ${user.email} already exists (ID: ${existing[0].id})`);
        createdGoogleUsers.push({ ...user, id: existing[0].id });
        continue;
      }
      
      const [result] = await connection.execute(
        `INSERT INTO users (openId, name, firstName, lastName, email, passwordHash, loginMethod, role, userType, jobTitle, status) 
         VALUES (?, ?, ?, ?, ?, ?, 'password', 'user', 'client', ?, 'active')`,
        [openId, fullName, user.firstName, user.lastName, user.email, passwordHash, user.jobTitle]
      );
      
      createdGoogleUsers.push({ ...user, id: result.insertId });
      console.log(`  Created: ${user.email} (ID: ${result.insertId})`);
    }
    
    // Get user IDs for workflow configuration
    const getUserId = async (email) => {
      const [rows] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
      return rows.length > 0 ? rows[0].id : null;
    };
    
    // Create approval roles if they don't exist
    console.log('\n--- Creating Approval Roles ---');
    const approvalRolesToCreate = [
      { code: 'SECURITY_OFFICER', name: 'Security Officer', level: 1, canFinalApprove: false },
      { code: 'SITE_MANAGER', name: 'Site Manager', level: 2, canFinalApprove: false },
      { code: 'SECURITY_MANAGER', name: 'Security Manager', level: 3, canFinalApprove: true },
      { code: 'EXTERNAL_MANAGER', name: 'External Company Manager', level: 1, canFinalApprove: false },
      { code: 'FACILITY_MANAGER', name: 'Facility Manager', level: 2, canFinalApprove: false },
      { code: 'OPERATIONS_MANAGER', name: 'Operations Manager', level: 3, canFinalApprove: true },
    ];
    
    for (const role of approvalRolesToCreate) {
      const [existing] = await connection.execute('SELECT id FROM approvalRoles WHERE code = ?', [role.code]);
      if (existing.length > 0) {
        console.log(`  Approval role ${role.code} already exists`);
        continue;
      }
      
      await connection.execute(
        `INSERT INTO approvalRoles (code, name, level, canFinalApprove, canReject, canRequestInfo, canDelegate, isActive) 
         VALUES (?, ?, ?, ?, true, true, true, true)`,
        [role.code, role.name, role.level, role.canFinalApprove]
      );
      console.log(`  Created approval role: ${role.code}`);
    }
    
    console.log('\n=== User Creation Complete ===');
    console.log(`Centre3 Users: ${createdCentre3Users.length}`);
    console.log(`Amazon Users: ${createdAmazonUsers.length}`);
    console.log(`Google Users: ${createdGoogleUsers.length}`);
    console.log('\nAll users have password: Test@123');
    
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch(console.error);

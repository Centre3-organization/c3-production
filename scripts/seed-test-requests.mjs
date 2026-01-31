/**
 * Seed Script: Create 20 Test Requests for Workflow Testing
 * 
 * Creates requests for all 20 test cases with "pending_l1" status
 * so they are ready for first approval testing.
 */

import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

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

// Generate unique request number
function generateRequestNumber(index) {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = String(index).padStart(3, '0');
  return `REQ-${dateStr}-TC${suffix}`;
}

// Generate random ID suffix
function randomSuffix() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function main() {
  const config = parseConnectionString(DATABASE_URL);
  const connection = await mysql.createConnection(config);
  
  console.log('Connected to database');
  
  try {
    // Get site IDs
    const [sites] = await connection.execute('SELECT id, code, name FROM sites WHERE status = "active" LIMIT 20');
    console.log(`Found ${sites.length} active sites`);
    
    // Get user IDs
    const [users] = await connection.execute(`
      SELECT id, email, name FROM users 
      WHERE email LIKE '%@centre3.com' 
         OR email LIKE '%@aws.com' 
         OR email LIKE '%@google.com'
         OR email LIKE '%@center3.com'
    `);
    console.log(`Found ${users.length} test users`);
    
    // Map users by email for easy lookup
    const userMap = {};
    users.forEach(u => userMap[u.email] = u);
    
    // Map sites by code
    const siteMap = {};
    sites.forEach(s => siteMap[s.code] = s);
    
    // Get Riyadh and Jabor site IDs
    const riyadhSite = sites.find(s => s.code === 'RDC46') || sites[0];
    const jaborSite = sites.find(s => s.code === 'JDC04') || sites[1] || sites[0];
    const defaultSite = sites[0];
    
    console.log(`Riyadh Site: ${riyadhSite?.name} (ID: ${riyadhSite?.id})`);
    console.log(`Jabor Site: ${jaborSite?.name} (ID: ${jaborSite?.id})`);
    
    // Define 20 test cases
    const testCases = [
      // Case 1-5: Standard Admin Visit (Centre3 internal users)
      {
        caseNum: 1,
        description: 'Standard Admin Visit - Security Officer → Site Manager → Security Manager',
        requestorEmail: 'securityofficer@centre3.com',
        visitorName: 'Test Visitor TC001',
        siteId: defaultSite?.id,
        type: 'admin_visit',
        purpose: 'Test Case 1: Standard 3-level approval workflow test'
      },
      {
        caseNum: 2,
        description: 'Riyadh Site Admin Visit - Riyadh Security Officer → Security Manager',
        requestorEmail: 'riyadhsecurityofficer@centre3.com',
        visitorName: 'Riyadh Test Visitor TC002',
        siteId: riyadhSite?.id,
        type: 'admin_visit',
        purpose: 'Test Case 2: Riyadh site-specific workflow test'
      },
      {
        caseNum: 3,
        description: 'Jabor Site Admin Visit - Jabor Officer → Site Manager → Security Manager',
        requestorEmail: 'jaborofficer@centre3.com',
        visitorName: 'Jabor Test Visitor TC003',
        siteId: jaborSite?.id,
        type: 'admin_visit',
        purpose: 'Test Case 3: Jabor site-specific workflow test'
      },
      {
        caseNum: 4,
        description: 'Facility Manager Request - Facility Inspection Workflow',
        requestorEmail: 'facilitymanager@centre3.com',
        visitorName: 'Facility Inspector TC004',
        siteId: defaultSite?.id,
        type: 'admin_visit',
        purpose: 'Test Case 4: Facility inspection workflow test'
      },
      {
        caseNum: 5,
        description: 'Operations Manager Request - VIP Workflow',
        requestorEmail: 'operationsmanager@centre3.com',
        visitorName: 'VIP Guest TC005',
        siteId: defaultSite?.id,
        type: 'admin_visit',
        purpose: 'Test Case 5: VIP expedited workflow test'
      },
      
      // Case 6-10: External Company - Amazon
      {
        caseNum: 6,
        description: 'Amazon User Request - External Company Workflow',
        requestorEmail: 'user1@aws.com',
        visitorName: 'AWS Engineer TC006',
        siteId: defaultSite?.id,
        type: 'admin_visit',
        purpose: 'Test Case 6: Amazon external company workflow - user1'
      },
      {
        caseNum: 7,
        description: 'Amazon Manager Request - External Company Workflow',
        requestorEmail: 'manager@aws.com',
        visitorName: 'AWS Manager Visit TC007',
        siteId: defaultSite?.id,
        type: 'admin_visit',
        purpose: 'Test Case 7: Amazon manager request workflow'
      },
      {
        caseNum: 8,
        description: 'Amazon Admin Request - External Company Workflow',
        requestorEmail: 'admin@aws.com',
        visitorName: 'AWS Admin TC008',
        siteId: riyadhSite?.id,
        type: 'admin_visit',
        purpose: 'Test Case 8: Amazon admin to Riyadh site'
      },
      {
        caseNum: 9,
        description: 'Amazon Engineer Request - External Company Workflow',
        requestorEmail: 'engineer@aws.com',
        visitorName: 'AWS Technical Lead TC009',
        siteId: jaborSite?.id,
        type: 'admin_visit',
        purpose: 'Test Case 9: Amazon engineer to Jabor site'
      },
      {
        caseNum: 10,
        description: 'Amazon User2 Request - External Company Workflow',
        requestorEmail: 'user2@aws.com',
        visitorName: 'AWS Consultant TC010',
        siteId: defaultSite?.id,
        type: 'admin_visit',
        purpose: 'Test Case 10: Amazon user2 standard request'
      },
      
      // Case 11-15: External Company - Google
      {
        caseNum: 11,
        description: 'Google User Request - External Company Workflow',
        requestorEmail: 'user1@google.com',
        visitorName: 'Google Engineer TC011',
        siteId: defaultSite?.id,
        type: 'admin_visit',
        purpose: 'Test Case 11: Google external company workflow - user1'
      },
      {
        caseNum: 12,
        description: 'Google Manager Request - External Company Workflow',
        requestorEmail: 'manager@google.com',
        visitorName: 'Google Manager Visit TC012',
        siteId: defaultSite?.id,
        type: 'admin_visit',
        purpose: 'Test Case 12: Google manager request workflow'
      },
      {
        caseNum: 13,
        description: 'Google Admin Request - External Company Workflow',
        requestorEmail: 'admin@google.com',
        visitorName: 'Google Admin TC013',
        siteId: riyadhSite?.id,
        type: 'admin_visit',
        purpose: 'Test Case 13: Google admin to Riyadh site'
      },
      {
        caseNum: 14,
        description: 'Google Engineer Request - External Company Workflow',
        requestorEmail: 'engineer@google.com',
        visitorName: 'Google SRE TC014',
        siteId: jaborSite?.id,
        type: 'admin_visit',
        purpose: 'Test Case 14: Google engineer to Jabor site'
      },
      {
        caseNum: 15,
        description: 'Google User2 Request - External Company Workflow',
        requestorEmail: 'user2@google.com',
        visitorName: 'Google Consultant TC015',
        siteId: defaultSite?.id,
        type: 'admin_visit',
        purpose: 'Test Case 15: Google user2 standard request'
      },
      
      // Case 16-20: Special Scenarios
      {
        caseNum: 16,
        description: 'Duty Manager Emergency Request',
        requestorEmail: 'dutymanager@centre3.com',
        visitorName: 'Emergency Contractor TC016',
        siteId: defaultSite?.id,
        type: 'admin_visit',
        purpose: 'Test Case 16: Emergency access workflow test'
      },
      {
        caseNum: 17,
        description: 'Shift Lead Request - Standard Workflow',
        requestorEmail: 'shiftlead@centre3.com',
        visitorName: 'Shift Replacement TC017',
        siteId: defaultSite?.id,
        type: 'admin_visit',
        purpose: 'Test Case 17: Shift lead standard request'
      },
      {
        caseNum: 18,
        description: 'Access Controller Request - Weekend Workflow',
        requestorEmail: 'accesscontroller@centre3.com',
        visitorName: 'Weekend Maintenance TC018',
        siteId: defaultSite?.id,
        type: 'admin_visit',
        purpose: 'Test Case 18: Weekend access workflow test'
      },
      {
        caseNum: 19,
        description: 'Site Manager Multi-Site Request',
        requestorEmail: 'sitemanager@centre3.com',
        visitorName: 'Multi-Site Audit TC019',
        siteId: riyadhSite?.id,
        type: 'admin_visit',
        purpose: 'Test Case 19: Site manager cross-site request'
      },
      {
        caseNum: 20,
        description: 'Security Manager High-Priority Request',
        requestorEmail: 'securitymanager@centre3.com',
        visitorName: 'Security Audit Team TC020',
        siteId: defaultSite?.id,
        type: 'admin_visit',
        purpose: 'Test Case 20: Security manager priority request'
      }
    ];
    
    console.log('\n=== Creating 20 Test Requests ===\n');
    
    const today = new Date().toISOString().slice(0, 10);
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    
    for (const tc of testCases) {
      // Find requestor
      let requestor = userMap[tc.requestorEmail];
      
      // Fallback to any available user if specific one not found
      if (!requestor) {
        requestor = users[0];
        console.log(`  Warning: ${tc.requestorEmail} not found, using ${requestor?.email}`);
      }
      
      if (!requestor) {
        console.log(`  Skipping TC${tc.caseNum}: No requestor found`);
        continue;
      }
      
      const requestNumber = generateRequestNumber(tc.caseNum);
      const visitorIdNumber = `ID${randomSuffix()}${tc.caseNum}`;
      
      try {
        // Check if request already exists
        const [existing] = await connection.execute(
          'SELECT id FROM requests WHERE requestNumber = ?',
          [requestNumber]
        );
        
        if (existing.length > 0) {
          console.log(`  TC${tc.caseNum}: Request ${requestNumber} already exists`);
          continue;
        }
        
        // Insert request with pending_l1 status
        await connection.execute(`
          INSERT INTO requests (
            requestNumber, type, status, requestorId, 
            visitorName, visitorIdType, visitorIdNumber, visitorCompany,
            visitorPhone, visitorEmail, siteId, purpose,
            startDate, endDate, startTime, endTime
          ) VALUES (?, ?, 'pending_l1', ?, ?, 'national_id', ?, ?, ?, ?, ?, ?, ?, ?, '09:00', '17:00')
        `, [
          requestNumber,
          tc.type,
          requestor.id,
          tc.visitorName,
          visitorIdNumber,
          tc.requestorEmail.includes('@aws.com') ? 'Amazon Web Services' : 
            tc.requestorEmail.includes('@google.com') ? 'Google Cloud' : 'Centre3',
          '+966500000' + String(tc.caseNum).padStart(3, '0'),
          `tc${tc.caseNum}@test.com`,
          tc.siteId || defaultSite?.id,
          tc.purpose,
          today,
          nextWeek
        ]);
        
        console.log(`  ✓ TC${tc.caseNum}: ${requestNumber} - ${tc.description}`);
        
      } catch (err) {
        console.log(`  ✗ TC${tc.caseNum}: Error - ${err.message}`);
      }
    }
    
    // Count created requests
    const [count] = await connection.execute(
      "SELECT COUNT(*) as cnt FROM requests WHERE requestNumber LIKE 'REQ-%-TC%' AND status = 'pending_l1'"
    );
    
    console.log(`\n=== Summary ===`);
    console.log(`Total test requests with pending_l1 status: ${count[0].cnt}`);
    console.log(`All requests are ready for first approval testing.`);
    
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch(console.error);

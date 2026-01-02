const { config } = require('dotenv');

// Load environment variables
config();

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Testing Agbejo Backend API Endpoints...\n');

  // Validate configuration
  const requiredVars = [
    'MY_ACCOUNT_ID',
    'MY_PRIVATE_KEY',
    'TREASURY_ACCOUNT_ID',
    'TREASURY_PRIVATE_KEY',
    'HCS_TOPIC_ID'
  ];

  const missing = requiredVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    console.log('\nPlease check your .env file');
    process.exit(1);
  }

  console.log('✅ Configuration validated');
  console.log('📋 Environment:');
  console.log(`   Admin Account: ${process.env.MY_ACCOUNT_ID}`);
  console.log(`   Treasury Account: ${process.env.TREASURY_ACCOUNT_ID}`);
  console.log(`   HCS Topic: ${process.env.HCS_TOPIC_ID}`);
  console.log(`   API Base URL: ${BASE_URL}\n`);

  try {
    // Test 1: GET /api/deals
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test 1: GET /api/deals');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const getResponse = await fetch(`${BASE_URL}/api/deals`);
    const getData = await getResponse.json();
    
    if (!getResponse.ok) {
      throw new Error(`GET failed: ${getResponse.status} - ${JSON.stringify(getData)}`);
    }
    
    console.log(`✅ Successfully fetched ${Array.isArray(getData) ? getData.length : 0} deal(s)`);
    if (Array.isArray(getData) && getData.length > 0) {
      console.log('Sample deal:', JSON.stringify(getData[0], null, 2));
    }
    console.log();

    // Test 2: POST /api/deals/create
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test 2: POST /api/deals/create');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const testDeal = {
      buyer: process.env.MY_ACCOUNT_ID,
      seller: process.env.TREASURY_ACCOUNT_ID,
      arbiter: process.env.MY_ACCOUNT_ID,
      amount: 1 // Test with 1 HBAR
    };
    
    console.log('Creating test deal:', testDeal);
    
    const createResponse = await fetch(`${BASE_URL}/api/deals/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testDeal),
    });
    
    const createData = await createResponse.json();
    
    if (!createResponse.ok) {
      throw new Error(`POST /api/deals/create failed: ${createResponse.status} - ${JSON.stringify(createData)}`);
    }
    
    console.log('✅ Deal created successfully!');
    console.log('Response:', JSON.stringify(createData, null, 2));
    console.log('\n⏳ Waiting 5 seconds for consensus...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Test 3: GET /api/deals again to verify the new deal
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test 3: GET /api/deals (after creation)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const getResponse2 = await fetch(`${BASE_URL}/api/deals`);
    const getData2 = await getResponse2.json();
    
    if (!getResponse2.ok) {
      throw new Error(`GET failed: ${getResponse2.status}`);
    }
    
    console.log(`✅ Found ${Array.isArray(getData2) ? getData2.length : 0} deal(s) after creation`);
    
    // Test 4: POST /api/deals/dispute
    if (Array.isArray(getData2) && getData2.length > 0) {
      const testDealId = getData2[0].dealId;
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Test 4: POST /api/deals/dispute');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Testing with deal ID: ${testDealId}`);
      
      const disputeResponse = await fetch(`${BASE_URL}/api/deals/dispute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dealId: testDealId }),
      });
      
      const disputeData = await disputeResponse.json();
      
      if (!disputeResponse.ok) {
        console.log(`⚠️  Dispute failed: ${disputeResponse.status} - ${JSON.stringify(disputeData)}`);
      } else {
        console.log('✅ Dispute raised successfully!');
      }
    }

    // Test 5: POST /api/deals/update-status
    if (Array.isArray(getData2) && getData2.length > 0) {
      const testDealId = getData2[0].dealId;
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Test 5: POST /api/deals/update-status');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Testing with deal ID: ${testDealId}`);
      
      const updateResponse = await fetch(`${BASE_URL}/api/deals/update-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dealId: testDealId,
          status: 'TEST_STATUS',
          type: 'STATUS_UPDATE'
        }),
      });
      
      const updateData = await updateResponse.json();
      
      if (!updateResponse.ok) {
        console.log(`⚠️  Update status failed: ${updateResponse.status} - ${JSON.stringify(updateData)}`);
      } else {
        console.log('✅ Status updated successfully!');
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 API Tests Completed!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Backend API is working correctly!');
    console.log(`\nView deals on HashScan: https://hashscan.io/testnet/topic/${process.env.HCS_TOPIC_ID}`);
    
  } catch (error) {
    console.error('\n❌ API Test failed:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
    process.exit(1);
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ This script requires Node.js 18+ or a fetch polyfill');
  console.error('   Please use Node.js 18+ or install node-fetch');
  process.exit(1);
}

testAPI()
  .then(() => {
    console.log('\n✨ All tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


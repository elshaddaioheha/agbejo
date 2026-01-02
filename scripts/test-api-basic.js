/**
 * Basic API Structure Test
 * Tests the backend API routes without requiring full environment setup
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function testAPIStructure() {
  console.log('🧪 Testing Agbejo Backend API Structure...\n');
  console.log(`Base URL: ${BASE_URL}\n`);

  const endpoints = [
    { method: 'GET', path: '/api/deals', description: 'Fetch all deals' },
    { method: 'POST', path: '/api/deals/create', description: 'Create a new deal', body: { seller: '0.0.123', arbiter: '0.0.456', amount: 1, buyer: '0.0.789' } },
    { method: 'POST', path: '/api/deals/dispute', description: 'Raise a dispute', body: { dealId: 'test-deal-123' } },
    { method: 'POST', path: '/api/deals/release-funds', description: 'Release funds to seller', body: { dealId: 'test-deal-123', seller: '0.0.123', amount: 1 } },
    { method: 'POST', path: '/api/deals/refund-buyer', description: 'Refund buyer', body: { dealId: 'test-deal-123', buyer: '0.0.789', amount: 1 } },
    { method: 'POST', path: '/api/deals/update-status', description: 'Update deal status', body: { dealId: 'test-deal-123', status: 'PENDING', type: 'STATUS_UPDATE' } },
  ];

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Testing API Endpoints...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let passed = 0;
  let failed = 0;

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.method} ${endpoint.path}`);
      console.log(`  Description: ${endpoint.description}`);
      
      const options = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (endpoint.body) {
        options.body = JSON.stringify(endpoint.body);
      }

      const response = await fetch(`${BASE_URL}${endpoint.path}`, options);
      const data = await response.json();

      // We expect some endpoints to fail without proper env vars, but we check if the route exists
      if (response.status === 200 || response.status === 400 || response.status === 500) {
        // Route exists and responds (even if with error)
        console.log(`  ✅ Route exists and responds (Status: ${response.status})`);
        
        if (response.status === 200) {
          console.log(`  ✅ Success! Response:`, JSON.stringify(data).substring(0, 100));
        } else if (response.status === 400) {
          console.log(`  ⚠️  Bad Request (expected without proper data): ${data.error || 'Missing fields'}`);
        } else if (response.status === 500) {
          console.log(`  ⚠️  Server Error (may need env vars): ${data.error || 'Internal error'}`);
        }
        passed++;
      } else if (response.status === 404) {
        console.log(`  ❌ Route not found (404)`);
        failed++;
      } else {
        console.log(`  ⚠️  Unexpected status: ${response.status}`);
        passed++;
      }
      
    } catch (error) {
      if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
        console.log(`  ❌ Cannot connect to ${BASE_URL}`);
        console.log(`     Make sure the dev server is running: npm run dev`);
        failed++;
      } else {
        console.log(`  ❌ Error: ${error.message}`);
        failed++;
      }
    }
    
    console.log();
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Test Summary: ${passed} passed, ${failed} failed`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (failed > 0) {
    console.log('💡 Tips:');
    console.log('   1. Make sure the dev server is running: npm run dev');
    console.log('   2. Check that all API routes are properly implemented');
    console.log('   3. For full functionality, configure .env file with Hedera credentials');
    process.exit(1);
  } else {
    console.log('✅ All API endpoints are accessible!');
    console.log('\nFor full functionality testing:');
    console.log('   1. Set up .env file with Hedera credentials');
    console.log('   2. Run: node scripts/test-deal.js');
    console.log('   3. Or run: node scripts/test-api.js');
    process.exit(0);
  }
}

// Check if fetch is available
if (typeof fetch === 'undefined') {
  console.error('❌ This script requires Node.js 18+ (has native fetch)');
  console.error('   Please upgrade to Node.js 18+ or install node-fetch');
  process.exit(1);
}

testAPIStructure();


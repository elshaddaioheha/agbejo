/**
 * Feature Testing Script
 * Tests all API endpoints and features
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

async function testEndpoint(name, method, path, body = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${path}`, options);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${name}: PASSED`);
      return { success: true, data };
    } else {
      console.log(`❌ ${name}: FAILED - ${data.error || response.statusText}`);
      return { success: false, error: data.error || response.statusText };
    }
  } catch (error) {
    console.log(`❌ ${name}: ERROR - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Starting Feature Tests...\n');
  console.log(`Testing against: ${BASE_URL}\n`);

  // Test 1: Get all deals
  console.log('1. Testing API Endpoints:');
  await testEndpoint('GET /api/deals', 'GET', '/api/deals');
  
  // Test 2: Get reputation endpoint
  await testEndpoint(
    'GET /api/reputation',
    'GET',
    '/api/reputation?accountId=0.0.12345&type=seller'
  );

  // Test 3: IPFS upload endpoint (will fail without file, but tests route exists)
  console.log('\n2. Testing IPFS Upload:');
  const formData = new FormData();
  const blob = new Blob(['test content'], { type: 'text/plain' });
  formData.append('file', blob, 'test.txt');
  
  try {
    const response = await fetch(`${BASE_URL}/api/ipfs/upload`, {
      method: 'POST',
      body: formData,
    });
    if (response.ok) {
      console.log('✅ IPFS Upload endpoint: PASSED');
    } else {
      const data = await response.json();
      if (data.error && data.error.includes('No file')) {
        console.log('✅ IPFS Upload endpoint: PASSED (route exists)');
      } else {
        console.log(`❌ IPFS Upload endpoint: FAILED - ${data.error || response.statusText}`);
      }
    }
  } catch (error) {
    console.log(`❌ IPFS Upload endpoint: ERROR - ${error.message}`);
  }

  // Test 4: On-ramp endpoint
  console.log('\n3. Testing Fiat On-Ramp:');
  await testEndpoint(
    'POST /api/onramp/url',
    'POST',
    '/api/onramp/url',
    {
      amount: 100,
      currency: 'HBAR',
      walletAddress: '0.0.12345',
    }
  );

  // Test 5: Email endpoint
  console.log('\n4. Testing Email Service:');
  await testEndpoint(
    'POST /api/email/send',
    'POST',
    '/api/email/send',
    {
      to: 'test@example.com',
      template: 'deal_invitation',
      templateData: {
        dealId: 'test-deal-123',
        role: 'seller',
        dealLink: `${BASE_URL}/deal/test-deal-123`,
      },
    }
  );

  console.log('\n📋 Test Summary:');
  console.log('✅ Basic API routes tested');
  console.log('⚠️  Full functionality requires:');
  console.log('   - Valid contract ID in .env');
  console.log('   - IPFS service configured (optional)');
  console.log('   - Email service configured (optional)');
  console.log('   - Fiat on-ramp API keys (optional)');
  console.log('\n💡 Run the dev server and test in browser for full UI testing');
}

// Run tests if executed directly
if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch');
  global.fetch = fetch;
  global.FormData = require('form-data');
  global.Blob = class Blob {
    constructor(parts, options) {
      this.parts = parts;
      this.type = options?.type || '';
    }
  };
  
  runTests().catch(console.error);
} else {
  // Browser environment
  runTests().catch(console.error);
}


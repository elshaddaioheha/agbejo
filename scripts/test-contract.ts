/**
 * Test script for EscrowContract
 * Tests all contract functions before integrating with API
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { contractUtils } from '../lib/contract';

async function testContract() {
  console.log('=== Testing EscrowContract ===\n');

  // Test account IDs (using your deployed account)
  const buyerAccountId = (process.env.MY_ACCOUNT_ID || '0.0.6928307').replace(/["']/g, '');
  const sellerAccountId = '0.0.1234567'; // Test seller (you'll need to use a real account)
  const arbiterAccountId = '0.0.7654321'; // Test arbiter (you'll need to use a real account)
  
  const testDealId = `test-deal-${Date.now()}`;
  const testAmount = 100; // 100 tinybars = 0.000001 HBAR

  try {
    // Test 1: Create Deal
    console.log('📝 Test 1: Creating deal...');
    console.log(`   Deal ID: ${testDealId}`);
    console.log(`   Buyer: ${buyerAccountId}`);
    console.log(`   Seller: ${sellerAccountId}`);
    console.log(`   Arbiter: ${arbiterAccountId}`);
    console.log(`   Amount: ${testAmount} tinybars\n`);

    const createStatus = await contractUtils.createDeal({
      dealId: testDealId,
      seller: sellerAccountId,
      arbiter: arbiterAccountId,
      amount: testAmount,
      description: 'Test deal for contract testing',
      arbiterFeeType: 'none',
      arbiterFeeAmount: 0,
      assetType: 'HBAR',
      assetId: '',
      assetSerialNumber: 0
    });

    console.log(`✅ Deal created! Status: ${createStatus}\n`);

    // Test 2: Query Deal
    console.log('🔍 Test 2: Querying deal...');
    try {
      const deal = await contractUtils.getDeal(testDealId);
      console.log('✅ Deal queried successfully!');
      console.log('   Deal data:', JSON.stringify(deal, null, 2));
    } catch (error: any) {
      console.log('⚠️  Query failed (may need to implement result parsing):', error.message);
    }
    console.log('');

    // Test 3: Accept as Seller (will fail if seller account is not real)
    console.log('👤 Test 3: Seller accepting deal...');
    try {
      const sellerAcceptStatus = await contractUtils.acceptAsSeller(testDealId, sellerAccountId);
      console.log(`✅ Seller accepted! Status: ${sellerAcceptStatus}\n`);
    } catch (error: any) {
      console.log(`⚠️  Seller accept failed (expected if using test account): ${error.message}\n`);
    }

    // Test 4: Accept as Arbiter (will fail if arbiter account is not real)
    console.log('⚖️  Test 4: Arbiter accepting deal...');
    try {
      const arbiterAcceptStatus = await contractUtils.acceptAsArbiter(testDealId, arbiterAccountId);
      console.log(`✅ Arbiter accepted! Status: ${arbiterAcceptStatus}\n`);
    } catch (error: any) {
      console.log(`⚠️  Arbiter accept failed (expected if using test account): ${error.message}\n`);
    }

    // Test 5: Fund Deal (requires buyer to have HBAR)
    console.log('💰 Test 5: Funding deal...');
    console.log(`   Amount: ${testAmount} tinybars`);
    try {
      const fundStatus = await contractUtils.fundDealHBAR(testDealId, testAmount, buyerAccountId);
      console.log(`✅ Deal funded! Status: ${fundStatus}\n`);
    } catch (error: any) {
      console.log(`⚠️  Funding failed: ${error.message}\n`);
    }

    // Test 6: Release Funds
    console.log('💸 Test 6: Releasing funds to seller...');
    try {
      const releaseStatus = await contractUtils.releaseFunds(testDealId, buyerAccountId);
      console.log(`✅ Funds released! Status: ${releaseStatus}\n`);
    } catch (error: any) {
      console.log(`⚠️  Release failed: ${error.message}\n`);
    }

    console.log('=== Testing Complete ===\n');
    console.log('📋 Summary:');
    console.log(`   Deal ID: ${testDealId}`);
    console.log(`   Contract ID: ${process.env.CONTRACT_ID}`);
    console.log(`   Network: ${process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet'}`);
    console.log('\n💡 Note: Some tests may fail if using placeholder account IDs.');
    console.log('   Update sellerAccountId and arbiterAccountId with real Hedera testnet accounts for full testing.');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run tests
testContract()
  .then(() => {
    console.log('\n✅ All tests completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });


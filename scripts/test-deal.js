const { config } = require('dotenv');
const { Client, TopicMessageSubmitTransaction, PrivateKey, AccountId } = require('@hashgraph/sdk');

// Load environment variables
config();

async function testDealFlow() {
  console.log('🧪 Testing Project Agbejo Deal Flow...\n');

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
  console.log(`   HCS Topic: ${process.env.HCS_TOPIC_ID}\n`);

  const client = Client.forTestnet();
  client.setOperator(
    AccountId.fromString(process.env.MY_ACCOUNT_ID),
    PrivateKey.fromString(process.env.MY_PRIVATE_KEY)
  );

  try {
    // Test 1: Create a deal
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test 1: Creating a new deal...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const dealId = `deal-${Date.now()}`;
    const dealMessage = { 
      type: "CREATE_DEAL", 
      dealId, 
      buyer: process.env.MY_ACCOUNT_ID,
      seller: process.env.TREASURY_ACCOUNT_ID,
      arbiter: process.env.MY_ACCOUNT_ID,
      amount: 5,
      status: "PENDING" 
    };

    const submitTx = await new TopicMessageSubmitTransaction({
      topicId: process.env.HCS_TOPIC_ID,
      message: JSON.stringify(dealMessage),
    }).execute(client);
    
    await submitTx.getReceipt(client);

    console.log('✅ Deal created successfully!');
    console.log(`   Deal ID: ${dealId}`);
    console.log(`   Buyer: ${process.env.MY_ACCOUNT_ID}`);
    console.log(`   Seller: ${process.env.TREASURY_ACCOUNT_ID}`);
    console.log(`   Amount: 5 HBAR\n`);

    // Wait for consensus
    console.log('⏳ Waiting 5 seconds for consensus...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Test 2: Fetch deals from mirror node
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test 2: Fetching deals from HCS...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const mirrorNodeUrl = `https://testnet.mirrornode.hedera.com/api/v1/topics/${process.env.HCS_TOPIC_ID}/messages`;
    const response = await fetch(mirrorNodeUrl);
    const data = await response.json();

    if (!data.messages || data.messages.length === 0) {
      console.log('⚠️  No messages found yet (might need more time)');
    } else {
      console.log(`✅ Found ${data.messages.length} message(s) in HCS topic\n`);
      
      // Parse the most recent message
      const lastMessage = data.messages[data.messages.length - 1];
      const decoded = Buffer.from(lastMessage.message, 'base64').toString('utf8');
      const parsed = JSON.parse(decoded);
      
      console.log('Latest Deal:');
      console.log(`   ID: ${parsed.dealId}`);
      console.log(`   Status: ${parsed.status}`);
      console.log(`   Amount: ${parsed.amount} HBAR\n`);
    }

    // Test 3: Update deal status
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test 3: Updating deal status...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const statusMessage = { 
      type: "STATUS_UPDATE", 
      dealId, 
      status: "APPROVED" 
    };

    const updateTx = await new TopicMessageSubmitTransaction({
      topicId: process.env.HCS_TOPIC_ID,
      message: JSON.stringify(statusMessage),
    }).execute(client);
    
    await updateTx.getReceipt(client);
    
    console.log('✅ Deal status updated to APPROVED\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 All tests completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nYour HCS topic is working correctly!');
    console.log(`View on HashScan: https://hashscan.io/testnet/topic/${process.env.HCS_TOPIC_ID}`);
    console.log('\nNext steps:');
    console.log('1. Run: npm run dev');
    console.log('2. Connect your wallet');
    console.log('3. Create a deal through the UI');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.status) {
      console.error('Status:', error.status.toString());
    }
    process.exit(1);
  } finally {
    client.close();
  }
}

testDealFlow()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
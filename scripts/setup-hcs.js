// This script creates a new HCS topic for Project Agbejo.
// Run it once using: node scripts/setup-hcs.js
// Make sure your .env file is populated with MY_ACCOUNT_ID and MY_PRIVATE_KEY

require('dotenv').config()
const {
  Client,
  PrivateKey,
  TopicCreateTransaction,
} = require('@hashgraph/sdk')

async function main() {
  console.log('--- Project Agbejo HCS Topic Setup ---')

  // 1. Validate Environment Variables
  const myAccountId = process.env.MY_ACCOUNT_ID
  const myPrivateKey = process.env.MY_PRIVATE_KEY
  const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet'

  if (!myAccountId || !myPrivateKey) {
    console.error(
      'Error: MY_ACCOUNT_ID and MY_PRIVATE_KEY must be set in your .env file.',
    )
    return
  }

  // 2. Configure Client
  let client
  if (network === 'mainnet') {
    client = Client.forMainnet()
  } else if (network === 'previewnet') {
    client = Client.forPreviewnet()
  } else {
    client = Client.forTestnet()
  }

  client.setOperator(myAccountId, PrivateKey.fromString(myPrivateKey))
  client.setDefaultMaxTransactionFee(new (require('@hashgraph/sdk').Hbar)(100))

  console.log(`\nUsing admin account: ${myAccountId} on ${network}`)

  try {
    // 3. Create the HCS Topic
    console.log('Creating new HCS topic...')
    const tx = new TopicCreateTransaction()
      .setAdminKey(PrivateKey.fromString(myPrivateKey).publicKey) // Set admin key
      .setTopicMemo('Project Agbejo - Escrow Deals Topic')

    const txResponse = await tx.execute(client)
    const receipt = await txResponse.getReceipt(client)
    const newTopicId = receipt.topicId

    if (newTopicId) {
      console.log(
        `\n✅ Success! New HCS Topic ID: ${newTopicId.toString()}`,
      )
      console.log(
        `\n*** ACTION REQUIRED ***
Please copy this line to your .env file:
HCS_TOPIC_ID=${newTopicId.toString()}
***********************\n`,
      )
    } else {
      throw new Error('Failed to create topic, no topic ID returned.')
    }
  } catch (error) {
    console.error('\n❌ Error creating HCS topic:', error)
    if (error.status) {
      console.error('Hedera Status:', error.status.toString())
    }
  } finally {
    client.close()
    console.log('Client connection closed.')
  }
}

main()
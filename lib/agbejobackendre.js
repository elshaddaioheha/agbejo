const {
    Client,
    PrivateKey,
    TopicMessageSubmitTransaction,
    TransferTransaction,
    Hbar
} = require("@hashgraph/sdk");

// --- Hardcoded Credentials ---
// For hackathon simplicity. In production, always use secure environment variables.
const MY_ACCOUNT_ID = "0.0.6928307"; // Replace with your Hedera account ID
const MY_PRIVATE_KEY = "0xb09d29f189e15596b93484fd96fa8b3c8cfdf2d9c6ad6d584718f612364aeb57";
const TREASURY_ACCOUNT_ID = "0.0.7057299";
const TREASURY_PRIVATE_KEY = "302e020100300506032b65700422042009e4343aab65e9490ab0723f756f6568806b0d68f2669d28c8aeafad60be0b05";
const HCS_TOPIC_ID = "0.0.7056921";


// A helper function to create a client for either the admin or the treasury
function createClient(type = 'admin') {
    const client = Client.forTestnet();
    // Securely configure the client based on the required role
    if (type === 'treasury' && TREASURY_ACCOUNT_ID && TREASURY_PRIVATE_KEY) {
        client.setOperator(TREASURY_ACCOUNT_ID, TREASURY_PRIVATE_KEY);
    } else if (MY_ACCOUNT_ID && MY_PRIVATE_KEY) {
        client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);
    } else {
        // This error will appear in your Vercel logs if variables are missing
        throw new Error("Client credentials are not configured correctly in the agbejo.js file.");
    }
    return client;
}

// Use module.exports to make these functions importable by your Next.js API routes
module.exports = {
    /**
     * Creates a new deal by submitting the initial details to the HCS topic.
     */
    async createDeal(buyerAccountId, sellerAccountId, arbiterAccountId, amount) {
        const client = createClient();
        console.log("API: Creating a new deal...");
        const dealId = `deal-${Date.now()}`;
        const dealMessage = { type: "CREATE_DEAL", dealId, buyer: buyerAccountId, seller: sellerAccountId, arbiter: arbiterAccountId, amount, status: "PENDING" };

        const submitMessageTx = await new TopicMessageSubmitTransaction({
            topicId: HCS_TOPIC_ID,
            message: JSON.stringify(dealMessage),
        }).execute(client);
        
        await submitMessageTx.getReceipt(client);
        
        console.log(`API: SUCCESS! Deal created with ID: ${dealId}`);
        client.close();
        return dealId; // Return the ID for the frontend to use
    },

    /**
     * Releases funds from the treasury to the seller.
     * This is a secure, server-side operation using the treasury's private key.
     */
    async releaseFunds(sellerAccountId, dealId, amount) {
        // This operation MUST be performed by the treasury account
        const treasuryClient = createClient('treasury');
        console.log(`API: Releasing ${amount} HBAR for deal ${dealId} to seller ${sellerAccountId}`);

        // Build the transaction to move funds from treasury to seller
        const transferTx = await new TransferTransaction()
            .addHbarTransfer(TREASURY_ACCOUNT_ID, new Hbar(-amount))
            .addHbarTransfer(sellerAccountId, new Hbar(amount))
            .freezeWith(treasuryClient);

        // Sign the transaction with the treasury's private key
        const signedTx = await transferTx.sign(PrivateKey.fromString(TREASURY_PRIVATE_KEY));
        
        // Execute the transaction
        const txResponse = await signedTx.execute(treasuryClient);
        
        // Wait for confirmation from the network
        await txResponse.getReceipt(treasuryClient);
        
        console.log(`API: SUCCESS! HBAR transfer to seller complete for deal ${dealId}.`);
        treasuryClient.close();
    },
};


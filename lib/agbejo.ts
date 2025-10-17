import {
    Client,
    PrivateKey,
    TopicMessageSubmitTransaction,
    TransferTransaction,
    Hbar
} from "@hashgraph/sdk";

// --- Credentials from Environment Variables ---
const MY_ACCOUNT_ID = process.env.MY_ACCOUNT_ID || "";
const MY_PRIVATE_KEY = process.env.MY_PRIVATE_KEY || "";
const TREASURY_ACCOUNT_ID = process.env.TREASURY_ACCOUNT_ID || "";
const TREASURY_PRIVATE_KEY = process.env.TREASURY_PRIVATE_KEY || "";
const HCS_TOPIC_ID = process.env.HCS_TOPIC_ID || "";

// A helper function to create a client for either the admin or the treasury
function createClient(type: 'admin' | 'treasury' = 'admin'): Client {
    const client = Client.forTestnet();
    // Securely configure the client based on the required role
    if (type === 'treasury' && TREASURY_ACCOUNT_ID && TREASURY_PRIVATE_KEY) {
        client.setOperator(TREASURY_ACCOUNT_ID, TREASURY_PRIVATE_KEY);
    } else if (MY_ACCOUNT_ID && MY_PRIVATE_KEY) {
        client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);
    } else {
        // This error will appear in your Vercel logs if variables are missing
        throw new Error("Client credentials are not configured correctly in the agbejo.ts file.");
    }
    return client;
}

// Export an object with our API functions
export default {
    /**
     * Creates a new deal by submitting the initial details to the HCS topic.
     */
    async createDeal(
        buyerAccountId: string,
        sellerAccountId: string,
        arbiterAccountId: string,
        amount: number
    ): Promise<string> {
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
        return dealId;
    },

    /**
     * Releases funds from the treasury to the seller.
     */
    async releaseFunds(
        sellerAccountId: string,
        dealId: string,
        amount: number
    ): Promise<void> {
        const treasuryClient = createClient('treasury');
        console.log(`API: Releasing ${amount} HBAR for deal ${dealId} to seller ${sellerAccountId}`);

        const transferTx = await new TransferTransaction()
            .addHbarTransfer(TREASURY_ACCOUNT_ID, new Hbar(-amount)) // Treasury pays
            .addHbarTransfer(sellerAccountId, new Hbar(amount))      // Seller receives
            .freezeWith(treasuryClient);
        
        const signedTx = await transferTx.sign(PrivateKey.fromString(TREASURY_PRIVATE_KEY));
        const txResponse = await signedTx.execute(treasuryClient);
        await txResponse.getReceipt(treasuryClient);
        
        await this.updateStatus(dealId, "SELLER_PAID", "RELEASE_FUNDS");
        
        console.log(`API: SUCCESS! HBAR transfer to seller complete for deal ${dealId}.`);
        treasuryClient.close();
    },

    /**
     * Submits a status update message to the HCS topic.
     */
    async updateStatus(
        dealId: string, 
        status: string, 
        type: string
    ): Promise<void> {
        const client = createClient('admin');
        console.log(`API: Updating status for deal ${dealId} to ${status}`);

        const statusUpdateMessage = { type, dealId, status };

        const submitMessageTx = await new TopicMessageSubmitTransaction({
          topicId: HCS_TOPIC_ID,
          message: JSON.stringify(statusUpdateMessage),
        }).execute(client);
        
        await submitMessageTx.getReceipt(client);
        
        console.log(`API: SUCCESS! Status updated on HCS for deal ${dealId}.`);
        client.close();
    },

    /**
     * ✅ CORRECTED: Refunds funds from the treasury back to the buyer.
     */
    async refundBuyer(
        buyerAccountId: string, 
        dealId: string, 
        amount: number
    ): Promise<void> {
        const treasuryClient = createClient('treasury');
        console.log(`API: Refunding ${amount} HBAR for deal ${dealId} to buyer ${buyerAccountId}`);

        // Correctly transfer from treasury (-) to buyer (+)
        const transferTx = await new TransferTransaction()
            .addHbarTransfer(TREASURY_ACCOUNT_ID, new Hbar(-amount)) // Treasury pays
            .addHbarTransfer(buyerAccountId, new Hbar(amount))      // Buyer receives
            .freezeWith(treasuryClient);

        // Sign and execute the transaction
        const signedTx = await transferTx.sign(PrivateKey.fromString(TREASURY_PRIVATE_KEY));
        const txResponse = await signedTx.execute(treasuryClient);
        await txResponse.getReceipt(treasuryClient);

        // Update the status on the audit log
        await this.updateStatus(dealId, "BUYER_REFUNDED", "REFUND_BUYER");

        console.log(`API: SUCCESS! HBAR refund to buyer complete for deal ${dealId}.`);
        treasuryClient.close();
    }
};
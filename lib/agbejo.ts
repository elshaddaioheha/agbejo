import {
    Client,
    PrivateKey,
    TopicMessageSubmitTransaction,
    TransferTransaction,
    Hbar
} from "@hashgraph/sdk";

// --- Type Definition for a Deal ---
type Deal = {
  dealId: string;
  buyer: string;
  seller: string;
  arbiter: string;
  amount: number;
  status: string;
  createdAt: string; 
};


// --- Credentials from Environment Variables ---
const MY_ACCOUNT_ID = process.env.MY_ACCOUNT_ID || "";
const MY_PRIVATE_KEY = process.env.MY_PRIVATE_KEY || "";
const TREASURY_ACCOUNT_ID = process.env.TREASURY_ACCOUNT_ID || "";
const TREASURY_PRIVATE_KEY = process.env.TREASURY_PRIVATE_KEY || "";
const HCS_TOPIC_ID = process.env.HCS_TOPIC_ID || "";

// A helper function to create a client for either the admin or the treasury
function createClient(type: 'admin' | 'treasury' = 'admin'): Client {
    if (!MY_ACCOUNT_ID || !MY_PRIVATE_KEY || !TREASURY_ACCOUNT_ID || !TREASURY_PRIVATE_KEY) {
        throw new Error("Environment variables are not configured correctly.");
    }
    
    const client = Client.forTestnet();
    
    if (type === 'treasury') {
        client.setOperator(TREASURY_ACCOUNT_ID, TREASURY_PRIVATE_KEY);
    } else {
        client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);
    }
    return client;
}

// Main object with our API functions
const agbejo = {
    /**
     * Fetches and processes all deal messages from the Hedera Mirror Node.
     */
    async getDeals(): Promise<Deal[]> {
        if (!HCS_TOPIC_ID) {
            throw new Error("HCS_TOPIC_ID is not configured in environment variables.");
        }
        const mirrorNodeUrl = `https://testnet.mirrornode.hedera.com/api/v1/topics/${HCS_TOPIC_ID}/messages`;
        
        const response = await fetch(mirrorNodeUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch messages from mirror node: ${response.statusText}`);
        }
        const data = await response.json();

        const decodedMessages = data.messages.map((msg: { message: string; consensus_timestamp: string }) => {
            try {
                const decoded = Buffer.from(msg.message, 'base64').toString('utf8');
                const parsed = JSON.parse(decoded);
                return { ...parsed, createdAt: msg.consensus_timestamp }; // Add timestamp
            } catch {
                return null;
            }
        }).filter(Boolean);

        const deals: Record<string, Deal> = {}; 

        for (const message of decodedMessages) {
            if (message.type === 'CREATE_DEAL') {
                deals[message.dealId] = {
                    dealId: message.dealId,
                    buyer: message.buyer,
                    seller: message.seller,
                    arbiter: message.arbiter,
                    amount: message.amount,
                    status: message.status,
                    createdAt: message.createdAt,
                };
            } else {
                if (deals[message.dealId]) {
                    deals[message.dealId].status = message.status;
                }
            }
        }

        return Object.values(deals);
    },

    /**
     * Creates a new deal by submitting the initial details to the HCS topic.
     */
    async createDeal(
        buyerAccountId: string,
        sellerAccountId: string,
        arbiterAccountId: string,
        amount: number
    ): Promise<string> {
        const client = createClient('admin');
        const dealId = `deal-${Date.now()}`;
        const dealMessage = { type: "CREATE_DEAL", dealId, buyer: buyerAccountId, seller: sellerAccountId, arbiter: arbiterAccountId, amount, status: "PENDING" };

        const submitMessageTx = await new TopicMessageSubmitTransaction({
            topicId: HCS_TOPIC_ID,
            message: JSON.stringify(dealMessage),
        }).execute(client);
        
        await submitMessageTx.getReceipt(client);
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
        
        const transferTx = await new TransferTransaction()
            .addHbarTransfer(TREASURY_ACCOUNT_ID, new Hbar(-amount))
            .addHbarTransfer(sellerAccountId, new Hbar(amount))
            .freezeWith(treasuryClient);
        
        const privateKey = PrivateKey.fromString(TREASURY_PRIVATE_KEY);
        const signedTx = await transferTx.sign(privateKey);
        const txResponse = await signedTx.execute(treasuryClient);
        await txResponse.getReceipt(treasuryClient);
        
        await this.updateStatus(dealId, "SELLER_PAID", "RELEASE_FUNDS");
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
        const statusUpdateMessage = { type, dealId, status };

        const submitMessageTx = await new TopicMessageSubmitTransaction({
          topicId: HCS_TOPIC_ID,
          message: JSON.stringify(statusUpdateMessage),
        }).execute(client);
        
        await submitMessageTx.getReceipt(client);
        client.close();
    },

    /**
     * Refunds funds from the treasury back to the buyer.
     */
    async refundBuyer(
        buyerAccountId: string, 
        dealId: string, 
        amount: number
    ): Promise<void> {
        const treasuryClient = createClient('treasury');

        const transferTx = await new TransferTransaction()
            .addHbarTransfer(TREASURY_ACCOUNT_ID, new Hbar(-amount))
            .addHbarTransfer(buyerAccountId, new Hbar(amount))
            .freezeWith(treasuryClient);

        const privateKey = PrivateKey.fromString(TREASURY_PRIVATE_KEY);
        const signedTx = await transferTx.sign(privateKey);
        const txResponse = await signedTx.execute(treasuryClient);
        await txResponse.getReceipt(treasuryClient);

        await this.updateStatus(dealId, "BUYER_REFUNDED", "REFUND_BUYER");
        treasuryClient.close();
    }
};

export default agbejo;


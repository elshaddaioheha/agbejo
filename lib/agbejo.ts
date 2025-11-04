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
const TREASURY_ACCOUNT_ID = process.env.TREASURY_ACCOUNT_ID || process.env.NEXT_PUBLIC_TREASURY_ACCOUNT_ID || "";
const TREASURY_PRIVATE_KEY = process.env.TREASURY_PRIVATE_KEY || "";
const HCS_TOPIC_ID = process.env.HCS_TOPIC_ID || "";

// Validation function
function validateConfig() {
    const missing = [];
    if (!MY_ACCOUNT_ID) missing.push("MY_ACCOUNT_ID");
    if (!MY_PRIVATE_KEY) missing.push("MY_PRIVATE_KEY");
    if (!TREASURY_ACCOUNT_ID) missing.push("TREASURY_ACCOUNT_ID");
    if (!TREASURY_PRIVATE_KEY) missing.push("TREASURY_PRIVATE_KEY");
    if (!HCS_TOPIC_ID) missing.push("HCS_TOPIC_ID");
    
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
    }
}

// A helper function to create a client for either the admin or the treasury
function createClient(type: 'admin' | 'treasury' = 'admin'): Client {
    validateConfig();
    
    const client = Client.forTestnet();
    
    if (type === 'treasury') {
        client.setOperator(TREASURY_ACCOUNT_ID, TREASURY_PRIVATE_KEY);
    } else {
        client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);
    }
    
    // Set request timeout for serverless environment
    client.setRequestTimeout(30000);
    
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
        
        // Fetch all messages with pagination
        // The Mirror Node API has a default limit, so we'll fetch in batches
        const limit = 100; // Maximum allowed by Hedera Mirror Node
        let allMessages: any[] = [];
        let nextUrl: string | null = `https://testnet.mirrornode.hedera.com/api/v1/topics/${HCS_TOPIC_ID}/messages?limit=${limit}&order=asc`;
        
        try {
            // Fetch all messages using pagination
            while (nextUrl) {
                const response: Response = await fetch(nextUrl, {
                    headers: {
                        'Accept': 'application/json',
                    },
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch messages from mirror node: ${response.statusText}`);
                }
                
                const data: any = await response.json();

                if (data.messages && Array.isArray(data.messages)) {
                    allMessages = allMessages.concat(data.messages);
                }

                // Check if there are more messages to fetch
                // The Mirror Node API returns a 'links' object with 'next' if there are more results
                if (data.links && data.links.next) {
                    nextUrl = String(data.links.next);
                } else {
                    nextUrl = null;
                }
            }

            console.log(`Fetched ${allMessages.length} total messages from mirror node`);

            // Decode all messages
            const decodedMessages = allMessages.map((msg: { message: string; consensus_timestamp: string }) => {
                try {
                    const decoded = Buffer.from(msg.message, 'base64').toString('utf8');
                    const parsed = JSON.parse(decoded);
                    return { ...parsed, createdAt: msg.consensus_timestamp };
                } catch (error) {
                    console.warn('Failed to decode message:', error);
                    return null;
                }
            }).filter(Boolean);

            console.log(`Decoded ${decodedMessages.length} messages`);

            // Process messages to build deals
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
                } else if (message.dealId && deals[message.dealId]) {
                    // Update status for existing deals
                    deals[message.dealId].status = message.status;
                }
            }

            const dealList = Object.values(deals);
            console.log(`Found ${dealList.length} unique deals`);
            
            // Sort deals by creation date (newest first)
            dealList.sort((a, b) => {
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();
                return dateB - dateA;
            });

            return dealList;
        } catch (error) {
            console.error('Error fetching deals:', error);
            throw error;
        }
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
        try {
            const dealId = `deal-${Date.now()}`;
            const dealMessage = { 
                type: "CREATE_DEAL", 
                dealId, 
                buyer: buyerAccountId, 
                seller: sellerAccountId, 
                arbiter: arbiterAccountId, 
                amount, 
                status: "PENDING" 
            };

            const submitMessageTx = await new TopicMessageSubmitTransaction({
                topicId: HCS_TOPIC_ID,
                message: JSON.stringify(dealMessage),
            }).execute(client);
            
            await submitMessageTx.getReceipt(client);
            return dealId;
        } finally {
            client.close();
        }
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
        try {
            const transferTx = await new TransferTransaction()
                .addHbarTransfer(TREASURY_ACCOUNT_ID, new Hbar(-amount))
                .addHbarTransfer(sellerAccountId, new Hbar(amount))
                .freezeWith(treasuryClient);
            
            const privateKey = PrivateKey.fromString(TREASURY_PRIVATE_KEY);
            const signedTx = await transferTx.sign(privateKey);
            const txResponse = await signedTx.execute(treasuryClient);
            await txResponse.getReceipt(treasuryClient);
            
            await this.updateStatus(dealId, "SELLER_PAID", "RELEASE_FUNDS");
        } finally {
            treasuryClient.close();
        }
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
        try {
            const statusUpdateMessage = { type, dealId, status };

            const submitMessageTx = await new TopicMessageSubmitTransaction({
              topicId: HCS_TOPIC_ID,
              message: JSON.stringify(statusUpdateMessage),
            }).execute(client);
            
            await submitMessageTx.getReceipt(client);
        } finally {
            client.close();
        }
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
        try {
            const transferTx = await new TransferTransaction()
                .addHbarTransfer(TREASURY_ACCOUNT_ID, new Hbar(-amount))
                .addHbarTransfer(buyerAccountId, new Hbar(amount))
                .freezeWith(treasuryClient);

            const privateKey = PrivateKey.fromString(TREASURY_PRIVATE_KEY);
            const signedTx = await transferTx.sign(privateKey);
            const txResponse = await signedTx.execute(treasuryClient);
            await txResponse.getReceipt(treasuryClient);

            await this.updateStatus(dealId, "BUYER_REFUNDED", "REFUND_BUYER");
        } finally {
            treasuryClient.close();
        }
    }
};

export default agbejo;
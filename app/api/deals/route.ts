// This is our secure backend endpoint to fetch and process deals from the HCS topic.
import { NextResponse } from 'next/server';

const HCS_TOPIC_ID = '0.0.7056921'; // Hardcoded HCS Topic ID

// ADDITION 1: Define a 'type' for our Deal object.
// This tells TypeScript the exact shape of our data.
type Deal = {
  dealId: string;
  buyer: string;
  seller: string;
  arbiter: string;
  amount: number;
  status: string;
};

export async function GET() {
  // Topic ID is now hardcoded, so no need to check if it exists
  try {
    const mirrorNodeUrl = `https://testnet.mirrornode.hedera.com/api/v1/topics/${HCS_TOPIC_ID}/messages`;
    
    const response = await fetch(mirrorNodeUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch messages from mirror node: ${response.statusText}`);
    }
    const data = await response.json();

    const decodedMessages = data.messages.map((msg: any) => {
        try {
            const decoded = Buffer.from(msg.message, 'base64').toString('utf8');
            return JSON.parse(decoded);
        } catch {
            return null;
        }
    }).filter(Boolean);

    // ADDITION 2: Explicitly type the 'deals' object.
    // This tells TypeScript: "This object will have strings as keys and Deal objects as values."
    const deals: Record<string, Deal> = {}; 

    for (const message of decodedMessages) {
        // This code now works because TypeScript knows the shape of 'deals'.
        if (message.type === 'CREATE_DEAL') {
            deals[message.dealId] = {
                dealId: message.dealId,
                buyer: message.buyer,
                seller: message.seller,
                arbiter: message.arbiter,
                amount: message.amount,
                status: message.status,
            };
        } else {
            if (deals[message.dealId]) {
                deals[message.dealId].status = message.status;
            }
        }
    }

    const dealsArray = Object.values(deals);
    
    return NextResponse.json(dealsArray);

  } catch (error) {
    console.error('Error fetching deals:', error);
    return NextResponse.json({ error: 'Failed to fetch deals.' }, { status: 500 });
  }
}


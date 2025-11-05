import { sql } from '@vercel/postgres';

// Database schema types
export interface DealRow {
  deal_id: string;
  buyer: string;
  seller: string;
  arbiter: string;
  amount: number;
  status: string;
  created_at: string;
  seller_accepted: boolean;
  arbiter_accepted: boolean;
  description: string | null;
  arbiter_fee_type: 'percentage' | 'flat' | null;
  arbiter_fee_amount: number;
  updated_at: string;
}

// Initialize database schema
export async function initDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS deals (
        deal_id VARCHAR(255) PRIMARY KEY,
        buyer VARCHAR(255) NOT NULL,
        seller VARCHAR(255) NOT NULL,
        arbiter VARCHAR(255) NOT NULL,
        amount DECIMAL(20, 8) NOT NULL,
        status VARCHAR(50) NOT NULL,
        created_at TIMESTAMP NOT NULL,
        seller_accepted BOOLEAN DEFAULT FALSE,
        arbiter_accepted BOOLEAN DEFAULT FALSE,
        description TEXT,
        arbiter_fee_type VARCHAR(20),
        arbiter_fee_amount DECIMAL(20, 8) DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes for faster queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_deals_buyer ON deals(buyer)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_deals_seller ON deals(seller)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_deals_arbiter ON deals(arbiter)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_deals_created_at ON deals(created_at DESC)
    `;

    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Upsert a deal (insert or update)
export async function upsertDeal(deal: {
  dealId: string;
  buyer: string;
  seller: string;
  arbiter: string;
  amount: number;
  status: string;
  createdAt: string;
  sellerAccepted?: boolean;
  arbiterAccepted?: boolean;
  description?: string;
  arbiterFeeType?: 'percentage' | 'flat' | null;
  arbiterFeeAmount?: number;
}) {
  try {
    await sql`
      INSERT INTO deals (
        deal_id, buyer, seller, arbiter, amount, status, created_at,
        seller_accepted, arbiter_accepted, description,
        arbiter_fee_type, arbiter_fee_amount, updated_at
      ) VALUES (
        ${deal.dealId},
        ${deal.buyer},
        ${deal.seller},
        ${deal.arbiter},
        ${deal.amount},
        ${deal.status},
        ${deal.createdAt},
        ${deal.sellerAccepted || false},
        ${deal.arbiterAccepted || false},
        ${deal.description || null},
        ${deal.arbiterFeeType || null},
        ${deal.arbiterFeeAmount || 0},
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (deal_id) DO UPDATE SET
        status = EXCLUDED.status,
        seller_accepted = EXCLUDED.seller_accepted,
        arbiter_accepted = EXCLUDED.arbiter_accepted,
        updated_at = CURRENT_TIMESTAMP
    `;
  } catch (error) {
    console.error('Error upserting deal:', error);
    throw error;
  }
}

// Get all deals
export async function getAllDeals(): Promise<DealRow[]> {
  try {
    const result = await sql`
      SELECT * FROM deals
      ORDER BY created_at DESC
    `;
    return result.rows as DealRow[];
  } catch (error) {
    console.error('Error fetching deals:', error);
    throw error;
  }
}

// Get deal by ID
export async function getDealById(dealId: string): Promise<DealRow | null> {
  try {
    const result = await sql`
      SELECT * FROM deals WHERE deal_id = ${dealId}
    `;
    return (result.rows[0] as DealRow) || null;
  } catch (error) {
    console.error('Error fetching deal:', error);
    throw error;
  }
}

// Convert database row to deal format
export function dbRowToDeal(row: DealRow) {
  return {
    dealId: row.deal_id,
    buyer: row.buyer,
    seller: row.seller,
    arbiter: row.arbiter,
    amount: parseFloat(row.amount.toString()),
    status: row.status,
    createdAt: row.created_at,
    sellerAccepted: row.seller_accepted,
    arbiterAccepted: row.arbiter_accepted,
    description: row.description || '',
    arbiterFeeType: row.arbiter_fee_type,
    arbiterFeeAmount: parseFloat(row.arbiter_fee_amount.toString()),
  };
}


# Implementation Guide for Remaining Features

## External Services Required

### 1. ✅ Arbiter Fees - COMPLETED
**No external services required** - Pure logic implementation

### 2. ✅ Backend Caching - IMPLEMENTED
**External Service: Database Required**

**Setup Instructions:**

#### Option 1: Vercel Postgres (Recommended)
1. Go to your Vercel project dashboard
2. Navigate to **Storage** → **Create Database** → **Postgres**
3. Copy the **Postgres URL** connection string
4. Add to Vercel environment variables:
   - `POSTGRES_URL` (automatically set by Vercel)
   - Or add manually: `POSTGRES_URL=postgres://...`

**The database will automatically sync every 5 minutes via Vercel Cron Jobs.**

#### Option 2: Manual Setup (Local Development)
For local development, you can:
1. Use a local Postgres instance, or
2. Use Supabase/Railway and set `POSTGRES_URL` in `.env.local`

**Implementation Complete:**
- ✅ Database schema created (`lib/db.ts`)
- ✅ Sync endpoint (`/api/deals/sync`)
- ✅ Automatic sync via Vercel Cron (every 5 minutes)
- ✅ API falls back to HCS if database unavailable
- ✅ New deals sync immediately to database

**Note:** The app will work without a database (falls back to HCS), but performance will be slower. Database is optional but recommended for production.

### 3. Hedera Name Service (HNS) Integration
**No external services required** - Uses public Hedera APIs

**APIs Used:**
- HNS Resolver API (public Hedera service)
- Testnet: `https://testnet.domainservice.hhns.tech/resolve`
- Mainnet: `https://mainnet.domainservice.hhns.tech/resolve`

**Implementation:**
- Create utility function to resolve `.hbar` names to account IDs
- Add validation in CreateDealModal
- Optional: Add reverse lookup (account ID → name)

### 4. HTS Token Support
**No external services required** - Uses Hedera SDK

**Implementation:**
- Add asset type selector (HBAR, Fungible Token, NFT)
- Update transaction logic to use `TokenTransferTransaction`
- Add token association check for treasury account
- Handle token decimals and serial numbers

## Recommended Implementation Order

1. ✅ **Arbiter Fees** - COMPLETED
2. **Backend Caching** - Will require database setup (Vercel Postgres recommended)
3. **HNS Integration** - Quick win, no external services
4. **HTS Token Support** - Most complex, requires SDK changes


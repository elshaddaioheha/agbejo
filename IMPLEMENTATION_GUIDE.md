# Implementation Guide for Remaining Features

## External Services Required

### 1. ✅ Arbiter Fees - COMPLETED
**No external services required** - Pure logic implementation

### 2. Backend Caching (Next Implementation)
**External Service: Database Required**

**Options:**
- **Vercel Postgres** (Recommended - Native Vercel integration)
  - Free tier: 256 MB storage, 60 hours compute/month
  - Setup: https://vercel.com/docs/storage/vercel-postgres
  - Cost: $0/month (free tier) or $20/month (hobby)
  
- **Supabase** (Alternative - PostgreSQL with real-time features)
  - Free tier: 500 MB database, 2 GB bandwidth
  - Setup: https://supabase.com/docs/guides/getting-started
  - Cost: $0/month (free tier) or $25/month (pro)

- **Railway** (Alternative - PostgreSQL)
  - Free tier: $5 credit/month
  - Setup: https://docs.railway.app/getting-started
  - Cost: ~$5-10/month for small apps

**Implementation Steps:**
1. Create database schema (deals table)
2. Create background worker/cron job to sync HCS topic → database
3. Update `/api/deals` to query database instead of HCS
4. Set up webhook or polling to keep database in sync

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


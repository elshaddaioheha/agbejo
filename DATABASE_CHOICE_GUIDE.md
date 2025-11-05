# Database Choice Guide for Agbejo

## ✅ Recommended: Neon (Serverless Postgres)

**Why Neon?**
- ✅ **Perfect for Vercel** - Serverless architecture matches Vercel's serverless functions
- ✅ **Free Tier** - 256 MB storage, 500 MB compute/month (perfect for starting)
- ✅ **Fast Setup** - Integrated directly in Vercel Marketplace
- ✅ **PostgreSQL Compatible** - Uses standard SQL, easy migration
- ✅ **Already Configured** - Code is already updated to use Neon!

### Setup Steps:

1. **In Vercel Dashboard:**
   - Go to your project
   - Click **Storage** → **Marketplace** → **Neon**
   - Click **Add Integration** or **Create Database**
   - Follow the wizard (choose region, database name)
   - Wait ~30 seconds for provisioning

2. **Automatic Configuration:**
   - Neon automatically adds `DATABASE_URL` to your Vercel environment variables
   - No manual setup needed!

3. **That's it!** The app will:
   - Auto-create the schema on first API call
   - Start syncing deals every 5 minutes
   - Use database for fast queries (10-100x faster)

## Alternative Options

### Supabase (Postgres Backend)
- **Pros:** Free tier, includes auth, real-time features
- **Cons:** Requires separate account setup
- **Best for:** If you want extra features (auth, real-time subscriptions)

### Turso (Serverless SQLite)
- **Pros:** Very fast, edge-optimized
- **Cons:** SQLite limitations (single writer, no complex transactions)
- **Best for:** Simple read-heavy workloads

### Upstash (Redis)
- **Pros:** Ultra-fast, great for caching
- **Cons:** Not a relational database, different data model
- **Best for:** Pure caching layer (would need Postgres + Redis)

## Current Implementation

✅ **Already migrated to Neon!**

The code uses `@neondatabase/serverless` which:
- Works with any PostgreSQL database (Neon, Supabase, etc.)
- Automatically falls back to HCS if database unavailable
- Uses lazy connection (only connects when needed)
- Supports both `DATABASE_URL` and `POSTGRES_URL` env vars

## Quick Start with Neon

1. **Create Neon Database** (via Vercel Marketplace)
2. **Deploy** - Database is automatically configured
3. **Test** - Visit `/api/deals/sync` to initialize schema
4. **Done!** 🎉

## Cost Comparison

| Provider | Free Tier | Paid Tier |
|----------|-----------|-----------|
| **Neon** | 256 MB, 500 MB compute | $19/month (10 GB) |
| Supabase | 500 MB database | $25/month (8 GB) |
| Turso | 500 MB, 10 locations | $29/month (10 GB) |

**For Agbejo:** Neon's free tier is perfect to start!

## Migration from Vercel Postgres

If you were using Vercel Postgres before:
- ✅ Code already updated to Neon
- ✅ Just create Neon database via Marketplace
- ✅ Connection string is automatically set
- ✅ No code changes needed!

## Local Development

For local testing, add to `.env.local`:
```
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
```

Get a free Neon database at [neon.tech](https://neon.tech) for local development!


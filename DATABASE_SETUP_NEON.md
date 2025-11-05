# Database Setup Guide - Neon (Recommended)

## Why Neon?

- ✅ **Serverless Postgres** - Perfect for Vercel serverless functions
- ✅ **Free Tier** - 256 MB storage, 500 MB compute/month
- ✅ **Fast & Reliable** - Optimized for edge/serverless workloads
- ✅ **Easy Integration** - Works seamlessly with Vercel
- ✅ **PostgreSQL Compatible** - Uses standard PostgreSQL

## Setup Steps

### 1. Create Neon Database

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Storage** → **Marketplace** → **Neon**
3. Click **Add Integration** or **Create Database**
4. Follow the setup wizard:
   - Choose a database name (e.g., `agbejo-db`)
   - Select region (choose closest to your users)
   - Click **Create Database**

### 2. Get Connection String

After creating the database:
1. Neon will automatically add `DATABASE_URL` to your Vercel environment variables
2. Or you can find it in Neon dashboard → **Connection Details**
3. Format: `postgresql://user:password@host/dbname?sslmode=require`

### 3. Environment Variables

**For Vercel (Automatic):**
- `DATABASE_URL` is automatically set by Neon integration

**For Local Development:**
Add to `.env.local`:
```
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
```

### 4. Verify Setup

The app will automatically:
- Create the database schema on first use
- Sync deals from HCS every 5 minutes (via cron)
- Use database for fast queries (fallback to HCS if unavailable)

## Alternative: Supabase

If you prefer Supabase:

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to **Settings** → **Database** → **Connection String**
4. Copy the connection string
5. Add to Vercel as `DATABASE_URL`

**Note:** You'll need to update `lib/db.ts` to use Supabase's client instead of Neon's, but the SQL queries remain the same.

## Migration from Vercel Postgres

If you were using `@vercel/postgres`, we've already migrated to `@neondatabase/serverless`. The code is compatible - just update the connection string!

## Troubleshooting

**Connection Errors:**
- Verify `DATABASE_URL` is set correctly
- Check that the database is active (not paused)
- Ensure SSL mode is set to `require`

**Schema Errors:**
- The schema is created automatically on first API call
- Check Vercel logs for initialization errors
- Manually run the SQL from `lib/db.ts` if needed


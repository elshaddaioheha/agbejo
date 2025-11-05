# Database Setup Guide

## Quick Setup (Vercel Postgres)

1. **Create Database in Vercel:**
   - Go to your Vercel project dashboard
   - Click **Storage** → **Create Database** → **Postgres**
   - Wait for provisioning (takes ~30 seconds)

2. **Environment Variable:**
   - Vercel automatically sets `POSTGRES_URL`
   - No manual configuration needed!

3. **Initial Sync:**
   - The database will auto-sync every 5 minutes via cron
   - Or manually trigger: `POST /api/deals/sync`

## How It Works

1. **Database Schema:** Created automatically on first API call
2. **Sync Process:**
   - Cron job runs every 5 minutes
   - Fetches all deals from HCS topic
   - Updates database with latest state
3. **API Endpoints:**
   - `GET /api/deals` - Reads from database (fast!)
   - Falls back to HCS if database unavailable
4. **Real-time Updates:**
   - New deals sync immediately
   - Status changes sync on next cron run (5 min max delay)

## Testing Locally

If you want to test with a local database:

1. Install Postgres locally or use Docker:
   ```bash
   docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=test postgres
   ```

2. Create `.env.local`:
   ```
   POSTGRES_URL=postgresql://postgres:test@localhost:5432/postgres
   ```

3. Run the sync endpoint:
   ```bash
   curl -X POST http://localhost:3000/api/deals/sync
   ```

## Performance Benefits

- **Before:** ~2-5 seconds to fetch deals (HCS mirror node)
- **After:** ~50-200ms to fetch deals (database query)
- **10-100x faster!** 🚀


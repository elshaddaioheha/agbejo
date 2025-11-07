# 🧪 How to Test the New Features

## Current Issue
You're only seeing one deal because the system is still using the old HCS-based deal fetching. I've updated it to fetch from the contract, but you need to create new deals to see them.

## Quick Fix: Create New Deals

1. **Create a new deal** - This will:
   - Use the new contract (0.0.7210432)
   - Include all new features (multi-sig, reputation, evidence)
   - Be tracked and visible in the deals list

2. **Test Multi-Sig Deal:**
   - Click "Create Deal"
   - Toggle "Multi-Signature Arbitration"
   - Add 3 arbiters (use different test account IDs)
   - Set required votes to 2
   - Create the deal
   - ✅ You should see all 3 arbiters listed with reputation badges

3. **Test Reputation:**
   - Complete a deal (seller gets paid)
   - ✅ Seller's reputation badge should show increased count
   - Resolve a dispute as arbiter
   - ✅ Arbiter's reputation badge should show increased count

4. **Test Evidence Upload:**
   - Create and fund a deal
   - Raise a dispute
   - Click "Submit Evidence"
   - Upload a file
   - ✅ Evidence hash should appear in the deal

5. **Test Voting Panel:**
   - Create multi-sig deal (3 arbiters, 2 votes)
   - Fund and dispute
   - As arbiter 1, vote
   - As arbiter 2, vote
   - ✅ Deal should auto-resolve when 2 votes reached

6. **Test Fiat On-Ramp:**
   - Create deal as buyer
   - When status is PENDING_FUNDS
   - ✅ "Buy with Card" button should appear

## Why Only One Deal Shows

The old deal was created with the previous contract/system. New deals created now will:
- Use the new contract (0.0.7210432)
- Include all new features
- Be properly tracked and displayed

## Solution

**Create new test deals** to see all the new features in action!

The system now:
1. ✅ Fetches from contract (new deals)
2. ✅ Falls back to HCS (old deals)
3. ✅ Tracks new deal IDs automatically
4. ✅ Shows all new features (multi-sig, reputation, evidence)

Try creating a new deal now and you'll see all the new features! 🚀


# 🧪 Testing Guide - Agbejo Features

This guide will help you test all the newly implemented features.

## Prerequisites

1. **Environment Setup**
   - `.env` file exists with correct contract ID
   - All required environment variables set
   - Dependencies installed

2. **Test Accounts**
   - Buyer account (with HBAR)
   - Seller account
   - Arbiter account(s)
   - For multi-sig: 3+ arbiter accounts

## Testing Checklist

### ✅ 1. Multi-Signature Arbitration

**Test Single Arbiter Deal:**
1. Create a deal with a single arbiter
2. Accept as seller
3. Accept as arbiter
4. Fund the deal
5. Raise a dispute
6. Resolve as arbiter (should work immediately)

**Test Multi-Sig Deal:**
1. Create a deal with 3 arbiters, required votes: 2
2. Accept as seller
3. Accept as all 3 arbiters
4. Fund the deal
5. Raise a dispute
6. Vote as arbiter 1 (seller)
7. Vote as arbiter 2 (seller) - should auto-resolve
8. Verify deal status changed to SELLER_PAID

**Test Multi-Sig Voting:**
1. Create deal with 3 arbiters, required votes: 2
2. Fund and dispute
3. Vote as arbiter 1 (buyer)
4. Vote as arbiter 2 (seller)
5. Vote as arbiter 3 (seller)
6. Should resolve to seller (2 seller votes > 1 buyer vote)

### ✅ 2. On-Chain Reputation

**Test Seller Reputation:**
1. Create and complete a deal (seller gets paid)
2. Check seller's reputation badge in DealsList
3. Should show "15 successful deals" (or current count)
4. Complete more deals to see reputation increase

**Test Arbiter Reputation:**
1. Create a deal with an arbiter
2. Raise a dispute
3. Resolve dispute as arbiter
4. Check arbiter's reputation badge
5. Should show "5 disputes resolved" (or current count)

### ✅ 3. Evidence Submission

**Test Evidence Upload:**
1. Create and fund a deal
2. Raise a dispute
3. Click "Submit Evidence"
4. Upload a file (PDF, image, etc.)
5. Verify file uploads to IPFS
6. Verify evidence hash appears in deal
7. Verify evidence link works

**Test Evidence Viewing:**
1. View a disputed deal with evidence
2. Click "View on IPFS" link
3. Verify evidence file is accessible

### ✅ 4. Fiat On-Ramp

**Test MoonPay/Banxa Integration:**
1. Create a deal as buyer
2. When deal status is PENDING_FUNDS
3. Click "Buy with Card" button
4. Verify payment URL opens in new tab
5. (Note: Actual payment requires API keys)

**Test Public Deal Page:**
1. Create a deal
2. Copy deal link from response
3. Open `/deal/[dealId]` in browser
4. Verify "Buy with Card" button appears
5. Test wallet connection on public page

### ✅ 5. Email Notifications

**Test Email Invitations:**
1. Create a deal with `sellerEmail` and `arbiterEmail`
2. Verify emails are sent (check console logs)
3. Verify email links work
4. Test opening deal from email link

**Test Deal Event Emails:**
1. Fund a deal (should trigger "deal_funded" email)
2. Raise dispute (should trigger "dispute_raised" email)
3. Resolve dispute (should trigger "deal_resolved" email)

### ✅ 6. Public Deal Pages

**Test Guest Access:**
1. Open `/deal/[dealId]` without wallet connected
2. Verify deal details are visible
3. Verify "Connect Wallet" prompt appears
4. Connect wallet and verify actions work

**Test All Features on Public Page:**
1. View deal details
2. See reputation badges
3. Submit evidence (if buyer/seller)
4. Vote on dispute (if arbiter)
5. Use fiat on-ramp button

### ✅ 7. Reputation Badges

**Test Badge Display:**
1. View DealsList
2. Verify reputation badges appear next to sellers
3. Verify reputation badges appear next to arbiters
4. Click badges to see detailed stats

**Test Badge Updates:**
1. Complete a deal
2. Refresh DealsList
3. Verify seller reputation increased
4. Resolve a dispute
5. Verify arbiter reputation increased

### ✅ 8. Voting Panel

**Test Voting Interface:**
1. Create multi-sig deal (3 arbiters, 2 votes required)
2. Fund and dispute
3. As arbiter 1, see voting panel
4. Vote for seller
5. Verify vote count updates
6. As arbiter 2, vote for seller
7. Verify deal auto-resolves

**Test Vote Progress:**
1. View voting panel
2. Verify "2 of 2 votes" progress
3. Verify which arbiters have voted
4. Verify vote distribution (seller vs buyer)

## Quick Test Script

Run these commands to test the API endpoints:

```bash
# Test get all deals
curl http://localhost:3000/api/deals

# Test get single deal
curl http://localhost:3000/api/deals/deal-123

# Test reputation
curl "http://localhost:3000/api/reputation?accountId=0.0.12345&type=seller"

# Test voting status
curl "http://localhost:3000/api/deals/voting-status?dealId=deal-123"
```

## Common Issues & Solutions

### Issue: Contract calls failing
**Solution:** Verify CONTRACT_ID in .env matches deployed contract

### Issue: IPFS upload failing
**Solution:** Set WEB3_STORAGE_TOKEN or PINATA_API_KEY in .env

### Issue: Email not sending
**Solution:** Set RESEND_API_KEY or SENDGRID_API_KEY in .env

### Issue: Fiat on-ramp not working
**Solution:** Set MOONPAY_API_KEY or BANXA_API_KEY in .env

### Issue: Reputation not showing
**Solution:** Complete at least one deal to increment reputation

## Test Data

Use these test account IDs (replace with your actual test accounts):
- Buyer: `0.0.xxxxx`
- Seller: `0.0.xxxxx`
- Arbiter 1: `0.0.xxxxx`
- Arbiter 2: `0.0.xxxxx`
- Arbiter 3: `0.0.xxxxx`

## Expected Results

After testing, you should have:
- ✅ Multi-sig deals working with voting
- ✅ Reputation badges showing correct counts
- ✅ Evidence uploads working
- ✅ Fiat on-ramp buttons appearing
- ✅ Email notifications sending (if configured)
- ✅ Public deal pages accessible
- ✅ All API endpoints responding correctly


# 🚀 Quick Start Testing Guide

## Step 1: Update Environment Variables

Your `.env` file has been updated with the new contract ID: `0.0.7210432`

## Step 2: Start the Development Server

```bash
npm run dev
```

The server will start at `http://localhost:3000`

## Step 3: Test Features in Browser

### Quick Test Checklist:

1. **Open the App**
   - Navigate to `http://localhost:3000`
   - Connect your wallet (HashPack or Blade)

2. **Test Multi-Sig Deal Creation**
   - Click "Create Deal"
   - Toggle "Multi-Signature Arbitration"
   - Add 3 arbiters
   - Set required votes to 2
   - Create the deal
   - ✅ Verify deal appears in DealsList

3. **Test Reputation Badges**
   - View DealsList
   - ✅ Verify reputation badges appear next to sellers/arbiters
   - Complete a deal
   - ✅ Verify reputation count increases

4. **Test Evidence Upload**
   - Create and fund a deal
   - Raise a dispute
   - Click "Submit Evidence"
   - Upload a test file
   - ✅ Verify evidence hash appears

5. **Test Voting Panel**
   - Create multi-sig deal (3 arbiters, 2 votes)
   - Fund and dispute
   - As arbiter 1, vote
   - As arbiter 2, vote
   - ✅ Verify deal auto-resolves

6. **Test Fiat On-Ramp**
   - Create a deal as buyer
   - When status is PENDING_FUNDS
   - ✅ Verify "Buy with Card" button appears
   - Click button (will open payment page if API keys configured)

7. **Test Public Deal Page**
   - Create a deal
   - Copy deal ID from response
   - Navigate to `/deal/[dealId]`
   - ✅ Verify deal details are visible
   - ✅ Verify all features work on public page

## Step 4: Test API Endpoints

In a new terminal, run:

```bash
# Test all API endpoints
npm run test:features
```

Or test manually:

```bash
# Get all deals
curl http://localhost:3000/api/deals

# Get reputation
curl "http://localhost:3000/api/reputation?accountId=0.0.12345&type=seller"

# Test on-ramp URL generation
curl -X POST http://localhost:3000/api/onramp/url \
  -H "Content-Type: application/json" \
  -d '{"amount":100,"currency":"HBAR","walletAddress":"0.0.12345"}'
```

## Step 5: Verify All Features

Check the `TESTING_GUIDE.md` for detailed test scenarios.

## Common Issues

### Contract calls failing?
- Verify `CONTRACT_ID=0.0.7210432` in `.env`
- Restart dev server after updating `.env`

### IPFS upload not working?
- Set `WEB3_STORAGE_TOKEN` or `PINATA_API_KEY` in `.env` (optional)

### Email not sending?
- Set `RESEND_API_KEY` or `SENDGRID_API_KEY` in `.env` (optional)

### Fiat on-ramp not working?
- Set `MOONPAY_API_KEY` or `BANXA_API_KEY` in `.env` (optional)

## Expected Results

After testing, you should see:
- ✅ Multi-sig deals with voting working
- ✅ Reputation badges showing counts
- ✅ Evidence uploads working
- ✅ Fiat on-ramp buttons appearing
- ✅ Public deal pages accessible
- ✅ All API endpoints responding

## Next Steps

1. Test all features according to `TESTING_GUIDE.md`
2. Report any issues
3. Set up optional services (email, IPFS, fiat on-ramp) for full functionality

Happy Testing! 🎉


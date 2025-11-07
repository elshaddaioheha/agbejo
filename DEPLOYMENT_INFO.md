# Contract Deployment Information

## ✅ Deployment Successful

**Date:** 2025-11-07  
**Network:** Hedera Testnet  
**Contract ID:** `0.0.7210432`  
**Contract Address (EVM):** `00000000000000000000000000000000006e05c0`  
**Deployer:** `0.0.6928307`

## 🔄 New Features Included

This deployment includes the following new features:

1. **Multi-Signature Arbitration**
   - Support for multiple arbiters (arbiter panels)
   - Voting mechanism with configurable required votes
   - Backward compatible with single arbiter mode

2. **On-Chain Reputation System**
   - Seller successful deals counter
   - Arbiter disputes resolved counter
   - View functions: `getSellerReputation()`, `getArbiterReputation()`

3. **Evidence Storage**
   - Evidence hash storage in Deal struct
   - `submitEvidence()` function for buyer/seller
   - Evidence hash included in dispute events

## 📝 Required Environment Variable Updates

**Please update your `.env` file with the following:**

```env
CONTRACT_ID=0.0.7210432
NEXT_PUBLIC_CONTRACT_ID=0.0.7210432
CONTRACT_ADDRESS=00000000000000000000000000000000006e05c0
```

## ⚠️ Important Notes

1. **Backward Compatibility:** The contract maintains backward compatibility with existing single-arbiter deals
2. **Migration:** Existing deals will continue to work with the old single-arbiter format
3. **New Deals:** New deals can use either single arbiter or multi-sig arbitration

## 🧪 Testing

After updating your `.env` file, you can test the new features:

1. Create a deal with multiple arbiters
2. Test the voting mechanism on disputes
3. Check reputation counters
4. Submit evidence for disputes

## 📚 Contract Functions

### New Functions:
- `voteOnDispute()` - Vote on dispute (works for both single and multi-sig)
- `submitEvidence()` - Submit evidence hash for disputed deals
- `getVotingStatus()` - Get voting status for multi-sig disputes
- `hasArbiterVoted()` - Check if an arbiter has voted
- `getSellerReputation()` - Get seller reputation count
- `getArbiterReputation()` - Get arbiter reputation count

### Updated Functions:
- `createDeal()` - Now accepts `arbiters[]` and `requiredVotes`
- `dispute()` - Now accepts `evidenceHash` parameter

### Legacy Functions (Still Supported):
- `resolveDispute()` - Calls `voteOnDispute()` for backward compatibility


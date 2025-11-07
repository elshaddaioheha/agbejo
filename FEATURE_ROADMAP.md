# Agbejo Feature Roadmap

## ✅ Already Implemented

Based on the current codebase review, the following features are **already complete**:

1. **Smart Contract-Based Escrow System** ✅
   - Contract deployed (`EscrowContract.sol`)
   - Supports HBAR, HTS fungible tokens, and NFTs
   - Deal lifecycle management (PROPOSED → PENDING_FUNDS → PENDING → DISPUTED/SELLER_PAID/BUYER_REFUNDED)

2. **Arbiter Fee System** ✅
   - Percentage or flat fee configuration
   - Fee calculation and distribution logic

3. **Basic Dispute Resolution** ✅
   - Single arbiter can resolve disputes
   - Buyer can raise disputes
   - Arbiter can release to seller or refund buyer

4. **Wallet Integration** ✅
   - HashPack and Blade wallet support
   - Transaction signing and execution

5. **API Endpoints** ✅
   - RESTful API for deal management
   - Endpoints for create, fund, accept, dispute, release, refund

6. **HNS Domain Resolution** ✅
   - Support for Hedera Name Service domains

---

## 🚧 Features To Implement

### Tier 1: Building Unbreakable Trust (The "Must-Haves")

#### 1. Smart Contract Audit ⚠️ **CRITICAL**
**Status:** ❌ Not Started  
**Priority:** HIGHEST

**What's Needed:**
- Hire a reputable third-party security firm (e.g., CertiK, OpenZeppelin, Trail of Bits)
- Full security audit of `EscrowContract.sol`
- Publish audit report publicly
- Fix any identified vulnerabilities
- Re-audit after fixes

**Why:** No serious user will lock funds in an unaudited contract. This is non-negotiable for production.

**Estimated Effort:** 2-4 weeks (external vendor)

---

#### 2. Multi-Signature (Multi-Sig) Arbitration
**Status:** ❌ Not Started  
**Priority:** HIGH

**Current State:** Contract only supports single arbiter (line 49 in `EscrowContract.sol`)

**What's Needed:**
- Modify contract to support arbiter panels (2-of-3, 3-of-5, etc.)
- Add voting mechanism in contract
- Update UI to allow selecting multiple arbiters
- Implement voting interface for arbiters
- Track votes and auto-resolve when majority reached

**Contract Changes Required:**
```solidity
struct Deal {
    // ... existing fields
    string[] arbiters;  // Array of arbiter account IDs
    uint256 requiredVotes;  // e.g., 2 for 2-of-3
    mapping(string => bool) arbiterVoted;  // Track who voted
    mapping(string => bool) arbiterVote;  // Track vote (true = seller, false = buyer)
    uint256 voteCount;  // Current vote count
}
```

**UI Changes:**
- Multi-select for arbiters in `CreateDealModal.tsx`
- Voting interface in `DealsList.tsx` for disputed deals
- Display vote progress

**Estimated Effort:** 1-2 weeks

---

#### 3. On-Chain Reputation System
**Status:** ❌ Not Started  
**Priority:** HIGH

**What's Needed:**
- Add reputation mappings to contract:
  ```solidity
  mapping(string => uint256) public sellerSuccessfulDeals;
  mapping(string => uint256) public arbiterDisputesResolved;
  ```
- Emit events when deals complete successfully
- Update contract to increment counters on `SELLER_PAID` and dispute resolution
- Display reputation stats in UI next to account IDs
- Add reputation filter/sorting in deals list

**Contract Changes:**
- Increment `sellerSuccessfulDeals[seller]` when status becomes `SELLER_PAID`
- Increment `arbiterDisputesResolved[arbiter]` when dispute resolved

**UI Changes:**
- Add reputation badges/components
- Show stats in deal cards and user profiles

**Estimated Effort:** 3-5 days

---

### Tier 2: Bridging Web2 & Web3 (Driving Adoption)

#### 4. Fiat On-Ramps
**Status:** ❌ Not Started  
**Priority:** MEDIUM-HIGH

**What's Needed:**
- Integrate fiat on-ramp service (MoonPay, Banxa, or C14)
- Add "Buy with Card" button in fund deal modal
- Calculate exact amount needed (deal amount + fees)
- Redirect to on-ramp, then auto-fund deal on return
- Handle callback/webhook for successful purchase

**Implementation:**
- Install on-ramp SDK (e.g., `@moonpay/moonpay-js`)
- Create `components/FundDealModal.tsx` with on-ramp option
- Add API endpoint to handle on-ramp callbacks
- Update `DealsList.tsx` to show on-ramp option

**Estimated Effort:** 1 week

---

#### 5. Link-Based Deals (Guest Checkout)
**Status:** ❌ Not Started  
**Priority:** MEDIUM-HIGH

**What's Needed:**
- Allow creating deals with email addresses instead of account IDs
- Generate unique deal links (e.g., `/deal/abc123`)
- Email service integration (SendGrid, Resend, or AWS SES)
- Email templates for seller/arbiter invitations
- Landing page for deal links with wallet creation flow
- Store email-to-account mapping in database

**Implementation:**
- Add email fields to `CreateDealModal.tsx`
- Create `/app/deal/[dealId]/page.tsx` for public deal pages
- Set up email service
- Add database schema for email mappings
- Create wallet onboarding flow for non-crypto users

**Estimated Effort:** 1-2 weeks

---

#### 6. Real-Time Notifications
**Status:** 🔄 In Progress (per README)  
**Priority:** MEDIUM

**Current State:** Listed as "In Progress" but no implementation found

**What's Needed:**
- Email notifications for:
  - Deal created (to seller/arbiter)
  - Deal funded (to seller)
  - Dispute raised (to arbiter)
  - Deal resolved (to buyer/seller)
- Optional: Push Protocol integration for Web3 notifications
- Background job/cron to check deal status changes
- Notification preferences per user

**Implementation:**
- Set up email service (if not done for #5)
- Create notification service in `lib/notifications.ts`
- Add notification triggers in API routes
- Create notification preferences UI

**Estimated Effort:** 3-5 days

---

### Tier 3: Becoming a Platform (The "Market Competitor")

#### 7. Formal Dispute Evidence Submission
**Status:** ❌ Not Started  
**Priority:** MEDIUM

**What's Needed:**
- File upload component for disputes
- IPFS or Arweave integration for decentralized storage
- Evidence room UI when deal is `DISPUTED`
- Evidence display for arbiters
- Link evidence hash to deal on-chain

**Implementation:**
- Install IPFS client (e.g., `ipfs-http-client`) or Arweave SDK
- Create `components/EvidenceRoom.tsx`
- Add evidence upload to dispute flow
- Store IPFS/Arweave hash in contract or database
- Display evidence in arbiter dispute resolution UI

**Contract Changes:**
```solidity
struct Deal {
    // ... existing fields
    string evidenceHash;  // IPFS/Arweave hash
}
```

**Estimated Effort:** 1 week

---

#### 8. Agbejo API/SDK for Marketplaces
**Status:** ⚠️ Partial (API exists but not documented as SDK)  
**Priority:** LOW-MEDIUM

**Current State:** API endpoints exist but not packaged as SDK

**What's Needed:**
- Create public API documentation (OpenAPI/Swagger)
- Build JavaScript/TypeScript SDK package
- Add API authentication (API keys)
- Rate limiting
- SDK examples and tutorials
- Marketplace integration guides

**Implementation:**
- Document all API endpoints
- Create `@agbejo/sdk` npm package
- Add API key management
- Create integration examples
- Build developer portal/docs site

**Estimated Effort:** 2-3 weeks

---

## 📊 Implementation Priority Summary

### Immediate (Before Production):
1. **Smart Contract Audit** - Critical for trust
2. **Multi-Sig Arbitration** - Critical for security
3. **On-Chain Reputation** - Critical for trust

### Short-Term (Next 1-2 Months):
4. **Fiat On-Ramps** - Drive adoption
5. **Link-Based Deals** - Lower barrier to entry
6. **Real-Time Notifications** - Better UX

### Long-Term (3+ Months):
7. **Dispute Evidence Submission** - Professional arbitration
8. **API/SDK for Marketplaces** - Platform expansion

---

## 🎯 Recommended Next Steps

1. **Start with Smart Contract Audit** - This is blocking production launch
2. **Implement Multi-Sig Arbitration** - Addresses single point of failure
3. **Add Reputation System** - Quick win for trust building
4. **Then focus on adoption features** (fiat on-ramps, link-based deals)

---

## 📝 Notes

- All features should maintain backward compatibility with existing deals
- Consider migration strategy for existing single-arbiter deals if implementing multi-sig
- API versioning will be important when building SDK
- Security should be prioritized over speed for Tier 1 features


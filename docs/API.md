# Agbejo API Documentation

## Base URL

```
Production: https://your-app.vercel.app/api
Development: http://localhost:3000/api
```

## Authentication

Currently, API endpoints use wallet-based authentication via Hedera account IDs. Future versions may include API key authentication for marketplace integrations.

---

## Deal Endpoints

### Create Deal

**POST** `/api/deals/create`

Create a new escrow deal proposal.

**Request Body:**
```json
{
  "seller": "0.0.12345",
  "arbiter": "0.0.67890",  // Single arbiter (optional if using multi-sig)
  "arbiters": ["0.0.111", "0.0.222", "0.0.333"],  // Multi-sig arbiters (optional)
  "requiredVotes": 2,  // Required votes for multi-sig (optional, default: 0 for single arbiter)
  "amount": 100,
  "description": "Product purchase",
  "arbiterFeeType": "percentage",  // "none" | "percentage" | "flat"
  "arbiterFeeAmount": 5,
  "assetType": "HBAR",  // "HBAR" | "FUNGIBLE_TOKEN" | "NFT"
  "assetId": "0.0.123456",  // Required for tokens/NFTs
  "assetSerialNumber": 1,  // Required for NFTs
  "sellerEmail": "seller@example.com",  // Optional: for email notifications
  "arbiterEmail": "arbiter@example.com",  // Optional: for single arbiter
  "arbiterEmails": ["arb1@example.com", "arb2@example.com"]  // Optional: for multi-sig
}
```

**Response:**
```json
{
  "message": "Deal proposed successfully!",
  "dealId": "deal-1234567890-abc123",
  "dealLink": "https://your-app.vercel.app/deal/deal-1234567890-abc123"
}
```

---

### Get All Deals

**GET** `/api/deals`

Fetch all deals from the smart contract.

**Response:**
```json
[
  {
    "dealId": "deal-1234567890-abc123",
    "buyer": "0.0.11111",
    "seller": "0.0.12345",
    "arbiter": "0.0.67890",
    "arbiters": ["0.0.111", "0.0.222"],
    "requiredVotes": 2,
    "amount": "100",
    "status": "PENDING",
    "createdAt": "1234567890",
    "sellerAccepted": true,
    "arbiterAccepted": true,
    "description": "Product purchase",
    "arbiterFeeType": "percentage",
    "arbiterFeeAmount": "5",
    "assetType": "HBAR",
    "assetId": "",
    "assetSerialNumber": "0",
    "evidenceHash": ""
  }
]
```

---

### Get Single Deal

**GET** `/api/deals/[dealId]`

Get details of a specific deal.

**Response:**
```json
{
  "dealId": "deal-1234567890-abc123",
  "buyer": "0.0.11111",
  "seller": "0.0.12345",
  "arbiter": "0.0.67890",
  "amount": "100",
  "status": "PENDING",
  ...
}
```

---

### Accept Deal

**POST** `/api/deals/accept`

Accept a deal as seller or arbiter.

**Request Body:**
```json
{
  "dealId": "deal-1234567890-abc123",
  "role": "seller"  // "seller" | "arbiter"
}
```

---

### Fund Deal

**POST** `/api/deals/fund`

Fund a deal (transfer assets to escrow).

**Request Body:**
```json
{
  "dealId": "deal-1234567890-abc123",
  "buyerAccountId": "0.0.11111"
}
```

---

### Release Funds

**POST** `/api/deals/release-funds`

Buyer releases funds to seller.

**Request Body:**
```json
{
  "dealId": "deal-1234567890-abc123",
  "buyerAccountId": "0.0.11111"
}
```

---

### Raise Dispute

**POST** `/api/deals/dispute`

Buyer raises a dispute.

**Request Body:**
```json
{
  "dealId": "deal-1234567890-abc123",
  "buyerAccountId": "0.0.11111",
  "evidenceHash": "Qm..."  // Optional: IPFS/Arweave hash
}
```

---

### Vote on Dispute

**POST** `/api/deals/vote`

Arbiter votes on a disputed deal (for multi-sig).

**Request Body:**
```json
{
  "dealId": "deal-1234567890-abc123",
  "arbiterAccountId": "0.0.67890",
  "releaseToSeller": true  // true = pay seller, false = refund buyer
}
```

---

### Submit Evidence

**POST** `/api/deals/evidence`

Submit evidence hash for a disputed deal.

**Request Body:**
```json
{
  "dealId": "deal-1234567890-abc123",
  "evidenceHash": "Qm..."
}
```

---

### Get Voting Status

**GET** `/api/deals/voting-status?dealId=deal-1234567890-abc123`

Get voting status for a multi-sig dispute.

**Response:**
```json
{
  "ok": true,
  "currentVotes": 2,
  "requiredVotes": 2,
  "sellerVoteCount": 2,
  "buyerVoteCount": 0
}
```

---

### Refund Buyer

**POST** `/api/deals/refund-buyer`

Arbiter refunds buyer (no dispute).

**Request Body:**
```json
{
  "dealId": "deal-1234567890-abc123",
  "arbiterAccountId": "0.0.67890"
}
```

---

## Reputation Endpoints

### Get Reputation

**GET** `/api/reputation?accountId=0.0.12345&type=seller`

Get reputation stats for a seller or arbiter.

**Query Parameters:**
- `accountId`: Hedera account ID
- `type`: `"seller"` or `"arbiter"`

**Response:**
```json
{
  "ok": true,
  "accountId": "0.0.12345",
  "type": "seller",
  "reputation": 15
}
```

---

## IPFS/Evidence Endpoints

### Upload Evidence

**POST** `/api/ipfs/upload`

Upload a file to IPFS/Arweave for dispute evidence.

**Request:** `multipart/form-data`
- `file`: File to upload (max 10MB)

**Response:**
```json
{
  "hash": "Qm...",
  "url": "https://ipfs.io/ipfs/Qm...",
  "service": "ipfs",
  "size": 1024,
  "name": "evidence.pdf",
  "type": "application/pdf"
}
```

---

## Fiat On-Ramp Endpoints

### Get On-Ramp URL

**POST** `/api/onramp/url`

Generate a fiat on-ramp payment URL.

**Request Body:**
```json
{
  "amount": 100,
  "currency": "HBAR",
  "walletAddress": "0.0.12345",
  "dealId": "deal-1234567890-abc123",  // Optional
  "provider": "moonpay"  // Optional: "moonpay" | "banxa" | "auto"
}
```

**Response:**
```json
{
  "ok": true,
  "url": "https://buy.moonpay.com/...",
  "provider": "moonpay"
}
```

---

## Email Endpoints

### Send Email

**POST** `/api/email/send`

Send an email notification.

**Request Body (Custom):**
```json
{
  "to": "user@example.com",
  "subject": "Deal Update",
  "html": "<p>Your deal has been updated.</p>",
  "text": "Your deal has been updated."
}
```

**Request Body (Template):**
```json
{
  "to": "user@example.com",
  "template": "deal_invitation",
  "templateData": {
    "dealId": "deal-1234567890-abc123",
    "role": "seller",
    "dealLink": "https://your-app.vercel.app/deal/deal-1234567890-abc123"
  }
}
```

**Available Templates:**
- `deal_invitation`: Invite seller/arbiter to a deal
- `deal_funded`: Notify that deal has been funded
- `dispute_raised`: Notify arbiters of a dispute
- `deal_resolved`: Notify of dispute resolution

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message describing what went wrong"
}
```

**HTTP Status Codes:**
- `200`: Success
- `400`: Bad Request (missing/invalid parameters)
- `403`: Forbidden (unauthorized action)
- `404`: Not Found
- `500`: Internal Server Error

---

## Rate Limiting

API rate limiting may be implemented in future versions. Currently, there are no rate limits.

---

## Webhooks

Webhook support for marketplace integrations is planned for future releases.

---

## SDK Usage Example

```typescript
// Create a deal
const response = await fetch('https://your-app.vercel.app/api/deals/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    seller: '0.0.12345',
    arbiter: '0.0.67890',
    amount: 100,
    description: 'Product purchase',
  }),
});

const { dealId, dealLink } = await response.json();
```

---

## Support

For API support, please contact: support@agbejo.com


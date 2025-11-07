# Agbejo JavaScript/TypeScript SDK

## Installation

```bash
npm install @agbejo/sdk
# or
yarn add @agbejo/sdk
# or
pnpm add @agbejo/sdk
```

## Quick Start

```typescript
import { AgbejoClient } from '@agbejo/sdk';

const client = new AgbejoClient({
  apiUrl: 'https://your-app.vercel.app/api',
  apiKey: 'your-api-key', // Optional for now
});

// Create a deal
const deal = await client.deals.create({
  seller: '0.0.12345',
  arbiter: '0.0.67890',
  amount: 100,
  description: 'Product purchase',
});

console.log('Deal created:', deal.dealId);
```

## API Reference

### AgbejoClient

Main client class for interacting with the Agbejo API.

```typescript
const client = new AgbejoClient(options: {
  apiUrl: string;
  apiKey?: string;
});
```

### Deals

#### `client.deals.create(params)`

Create a new deal.

```typescript
const deal = await client.deals.create({
  seller: '0.0.12345',
  arbiter: '0.0.67890',  // or arbiters: ['0.0.111', '0.0.222']
  requiredVotes: 2,  // for multi-sig
  amount: 100,
  description: 'Product purchase',
  arbiterFeeType: 'percentage',
  arbiterFeeAmount: 5,
  assetType: 'HBAR',
  sellerEmail: 'seller@example.com',  // Optional
  arbiterEmail: 'arbiter@example.com',  // Optional
});
```

#### `client.deals.getAll()`

Get all deals.

```typescript
const deals = await client.deals.getAll();
```

#### `client.deals.get(dealId)`

Get a specific deal.

```typescript
const deal = await client.deals.get('deal-1234567890-abc123');
```

#### `client.deals.accept(dealId, role)`

Accept a deal.

```typescript
await client.deals.accept('deal-1234567890-abc123', 'seller');
```

#### `client.deals.fund(dealId, buyerAccountId)`

Fund a deal.

```typescript
await client.deals.fund('deal-1234567890-abc123', '0.0.11111');
```

#### `client.deals.releaseFunds(dealId, buyerAccountId)`

Release funds to seller.

```typescript
await client.deals.releaseFunds('deal-1234567890-abc123', '0.0.11111');
```

#### `client.deals.dispute(dealId, buyerAccountId, evidenceHash?)`

Raise a dispute.

```typescript
await client.deals.dispute('deal-1234567890-abc123', '0.0.11111', 'Qm...');
```

#### `client.deals.vote(dealId, arbiterAccountId, releaseToSeller)`

Vote on a dispute (multi-sig).

```typescript
await client.deals.vote('deal-1234567890-abc123', '0.0.67890', true);
```

#### `client.deals.submitEvidence(dealId, evidenceHash)`

Submit evidence for a dispute.

```typescript
await client.deals.submitEvidence('deal-1234567890-abc123', 'Qm...');
```

### Reputation

#### `client.reputation.get(accountId, type)`

Get reputation stats.

```typescript
const reputation = await client.reputation.get('0.0.12345', 'seller');
console.log(reputation.reputation); // 15
```

### IPFS

#### `client.ipfs.upload(file)`

Upload a file to IPFS.

```typescript
const file = new File(['content'], 'evidence.pdf');
const result = await client.ipfs.upload(file);
console.log(result.hash); // Qm...
```

### On-Ramp

#### `client.onramp.getUrl(params)`

Get fiat on-ramp payment URL.

```typescript
const result = await client.onramp.getUrl({
  amount: 100,
  currency: 'HBAR',
  walletAddress: '0.0.12345',
  dealId: 'deal-1234567890-abc123',
});
window.open(result.url);
```

## Error Handling

```typescript
try {
  const deal = await client.deals.create({ ... });
} catch (error) {
  if (error instanceof AgbejoError) {
    console.error('API Error:', error.message);
    console.error('Status:', error.status);
  }
}
```

## TypeScript Support

Full TypeScript definitions are included.

```typescript
import { Deal, DealStatus, AssetType } from '@agbejo/sdk';

const deal: Deal = {
  dealId: 'deal-123',
  buyer: '0.0.11111',
  seller: '0.0.12345',
  amount: 100,
  status: 'PENDING' as DealStatus,
  // ...
};
```

## Examples

### E-commerce Integration

```typescript
// Create escrow for an order
const deal = await client.deals.create({
  seller: merchantAccountId,
  arbiter: trustedArbiterId,
  amount: orderTotal,
  description: `Order #${orderId}`,
  sellerEmail: customerEmail,
});

// Send deal link to customer
await sendEmail({
  to: customerEmail,
  subject: 'Complete Your Purchase',
  body: `Click here to fund your order: ${deal.dealLink}`,
});
```

### Marketplace Integration

```typescript
// Create deal with multi-sig arbitration
const deal = await client.deals.create({
  seller: sellerAccountId,
  arbiters: [arbiter1, arbiter2, arbiter3],
  requiredVotes: 2,
  amount: productPrice,
  description: productName,
});

// Monitor deal status
const checkDeal = setInterval(async () => {
  const updated = await client.deals.get(deal.dealId);
  if (updated.status === 'SELLER_PAID') {
    // Release product to buyer
    clearInterval(checkDeal);
  }
}, 5000);
```

## License

MIT


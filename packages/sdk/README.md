# @agbejo/sdk

Official JavaScript/TypeScript SDK for Agbejo Escrow Platform.

## Installation

```bash
npm install @agbejo/sdk
```

## Usage

```typescript
import { AgbejoClient } from '@agbejo/sdk';

const client = new AgbejoClient({
  apiUrl: 'https://your-app.vercel.app/api',
});

// Create a deal
const deal = await client.deals.create({
  seller: '0.0.12345',
  arbiter: '0.0.67890',
  amount: 100,
  description: 'Product purchase',
});
```

See [SDK.md](../../docs/SDK.md) for full documentation.


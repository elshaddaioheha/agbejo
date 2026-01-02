# Agbejo - Decentralized Escrow Platform

<div align="center">

**A secure, trustless escrow platform built on Hedera Hashgraph**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![Hedera](https://img.shields.io/badge/Hedera-Hashgraph-00A8E0)](https://hedera.com/)

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [API Reference](#-api-reference) • [Deployment](#-deployment)

</div>

---

## 📖 About

Agbejo is a production-ready decentralized escrow platform that enables secure peer-to-peer transactions on the Hedera Hashgraph network. Built with smart contracts, it provides trustless escrow services with multi-signature arbitration, on-chain reputation, and comprehensive dispute resolution.

### Why Agbejo?

- 🔒 **Trustless Security**: Smart contract-based escrow eliminates the need for trusted intermediaries
- ⚡ **Fast & Low Cost**: Leverages Hedera's fast finality (3-5 seconds) and low transaction fees
- 🎯 **Multi-Sig Arbitration**: Configurable arbiter panels (2-of-3, 3-of-5, etc.) for fair dispute resolution
- 📊 **On-Chain Reputation**: Transparent reputation system for sellers and arbiters
- 💳 **Fiat On-Ramp**: Buy crypto directly with credit/debit cards
- 📧 **Email Notifications**: Real-time updates for all deal events
- 🔗 **Link-Based Deals**: Share deals via email links, no wallet required initially
- 📁 **Evidence Storage**: IPFS/Arweave integration for dispute evidence

---

## ✨ Features

### Core Functionality

- **Smart Contract Escrow**: All funds are secured by a deployed smart contract on Hedera
- **Multi-Asset Support**: HBAR, HTS fungible tokens, and NFTs
- **Wallet Integration**: Seamless connection with HashPack and Blade wallets
- **Dispute Resolution**: Professional arbitration with evidence submission
- **Public Deal Pages**: Shareable deal links for easy access

### Advanced Features

#### 🛡️ Trust & Security
- **Multi-Signature Arbitration**: Configurable arbiter panels with voting mechanism
- **On-Chain Reputation**: Track successful deals and resolved disputes
- **Evidence Storage**: IPFS/Arweave integration for dispute documentation

#### 🚀 Adoption & UX
- **Fiat On-Ramp**: MoonPay and Banxa integration for buying crypto with cards
- **Link-Based Deals**: Email invitations with guest checkout flow
- **Real-Time Notifications**: Email alerts for all deal events
- **Reputation Badges**: Visual indicators of seller/arbiter trustworthiness

#### 🔧 Platform & Integration
- **RESTful API**: Complete API for marketplace integrations
- **SDK Package**: TypeScript SDK for easy integration
- **Public Deal Pages**: Guest-accessible deal pages
- **Comprehensive Documentation**: API docs, SDK docs, and guides

---

## 🏗️ Architecture

### Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit
- **Blockchain**: Hedera Hashgraph
- **Smart Contracts**: Solidity 0.8.0+
- **Wallet**: HashConnect (HashPack & Blade)
- **Storage**: IPFS/Arweave (via Web3.Storage/Pinata)
- **Email**: Resend/SendGrid
- **Fiat On-Ramp**: MoonPay/Banxa

### Smart Contract

**Contract ID**: `0.0.7210432` (Hedera Testnet)  
**Contract Address**: `00000000000000000000000000000000006e05c0`

The contract handles:
- Deal creation and state management
- Multi-signature arbitration voting
- Reputation tracking
- Evidence hash storage
- Fund escrow and release

See [DEPLOYMENT_INFO.md](./DEPLOYMENT_INFO.md) for contract details.

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- A Hedera testnet account ([portal.hedera.com](https://portal.hedera.com/))
- A WalletConnect Project ID ([cloud.walletconnect.com](https://cloud.walletconnect.com/))

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/elshaddaioheha/agbejo.git
   cd agbejo
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.template .env
   # Edit .env and fill in your values
   ```

4. **Configure environment variables:**
   
   **Required:**
   ```env
   # Hedera Network
   NEXT_PUBLIC_HEDERA_NETWORK=testnet
   
   # Admin Account
   MY_ACCOUNT_ID=0.0.xxxxx
   MY_PRIVATE_KEY=302e0201...
   
   # Smart Contract
   CONTRACT_ID=0.0.7210432
   NEXT_PUBLIC_CONTRACT_ID=0.0.7210432
   CONTRACT_ADDRESS=00000000000000000000000000000000006e05c0
   
   # WalletConnect
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
   ```
   
   **Optional (for full functionality):**
   ```env
   # Email Service
   RESEND_API_KEY=re_...
   # or
   SENDGRID_API_KEY=SG....
   FROM_EMAIL=noreply@agbejo.com
   
   # IPFS/Arweave
   WEB3_STORAGE_TOKEN=your_token
   # or
   PINATA_API_KEY=your_key
   PINATA_SECRET_KEY=your_secret
   
   # Fiat On-Ramp
   NEXT_PUBLIC_MOONPAY_API_KEY=your_key
   # or
   NEXT_PUBLIC_BANXA_API_KEY=your_key
   
   # Application URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📋 Project Structure

```
agbejo/
├── app/                      # Next.js app directory
│   ├── api/                 # API routes
│   │   ├── deals/          # Deal management endpoints
│   │   ├── email/          # Email service
│   │   ├── ipfs/           # IPFS upload
│   │   ├── onramp/         # Fiat on-ramp
│   │   └── reputation/     # Reputation queries
│   ├── deal/               # Public deal pages
│   └── page.tsx            # Home page
├── components/              # React components
│   ├── CreateDealModal.tsx # Deal creation UI
│   ├── DealsList.tsx       # Deal listing with features
│   ├── VotingPanel.tsx     # Multi-sig voting interface
│   ├── ReputationBadge.tsx # Reputation display
│   ├── EvidenceUpload.tsx  # Evidence submission
│   └── ...
├── contracts/               # Smart contracts
│   └── EscrowContract.sol  # Main escrow contract
├── lib/                     # Core libraries
│   ├── contract.ts         # Contract utilities
│   ├── hashconnect.ts      # Wallet integration
│   ├── ipfs.ts             # IPFS/Arweave
│   ├── email.ts            # Email service
│   ├── fiat-onramp.ts      # On-ramp integration
│   └── notifications.ts     # Notification system
├── packages/                # SDK package
│   └── sdk/                # TypeScript SDK
├── docs/                    # Documentation
│   ├── API.md              # API documentation
│   └── SDK.md              # SDK documentation
└── scripts/                 # Utility scripts
```

---

## 🔧 How It Works

### Deal Flow

1. **Create Deal**
   - Buyer creates a deal with seller and arbiter(s)
   - Choose single arbiter or multi-sig panel
   - Set deal amount, description, and fees
   - Deal is created on smart contract

2. **Acceptance**
   - Seller accepts the deal
   - Arbiter(s) accept the deal
   - Deal moves to `PENDING_FUNDS` status

3. **Funding**
   - Buyer funds the deal (HBAR, tokens, or NFT)
   - Funds are locked in smart contract escrow
   - Deal moves to `PENDING` status

4. **Completion or Dispute**
   - **Normal Flow**: Buyer releases funds to seller
   - **Dispute Flow**: Buyer raises dispute → Arbiters vote → Resolution

5. **Resolution**
   - Single arbiter: Immediate resolution
   - Multi-sig: Votes collected, auto-resolves when threshold reached

### Deal States

- `PROPOSED` - Deal created, awaiting acceptance
- `PENDING_FUNDS` - Accepted, awaiting buyer funding
- `PENDING` - Funded, awaiting buyer action
- `DISPUTED` - Dispute raised, awaiting arbitration
- `SELLER_PAID` - Funds released to seller
- `BUYER_REFUNDED` - Funds refunded to buyer

---

## 📝 API Reference

### Deal Management

- `GET /api/deals` - Get all deals
- `GET /api/deals/[dealId]` - Get single deal
- `POST /api/deals/create` - Create new deal
- `POST /api/deals/accept` - Accept deal (seller/arbiter)
- `POST /api/deals/fund` - Fund deal
- `POST /api/deals/release-funds` - Release funds to seller
- `POST /api/deals/dispute` - Raise dispute
- `POST /api/deals/vote` - Vote on dispute (multi-sig)
- `POST /api/deals/evidence` - Submit evidence

### Reputation

- `GET /api/reputation?accountId=0.0.xxx&type=seller` - Get reputation

### Services

- `POST /api/ipfs/upload` - Upload file to IPFS
- `POST /api/onramp/url` - Generate fiat on-ramp URL
- `POST /api/email/send` - Send email notification

**Full API Documentation**: See [docs/API.md](./docs/API.md)

---

## 🧪 Testing

### Run Tests

```bash
# Test API endpoints
npm run test:features

# Test contract
npm run test:contract
```

### Manual Testing

1. Create a deal with multiple arbiters
2. Test the voting mechanism
3. Upload evidence for disputes
4. Check reputation badges
5. Test fiat on-ramp flow

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for detailed test scenarios.

---

## 🔨 Smart Contract

### Deployment

**Current Deployment:**
- **Network**: Hedera Testnet
- **Contract ID**: `0.0.7210432`
- **Contract Address**: `00000000000000000000000000000000006e05c0`

### Compile & Deploy

```bash
# Compile contract
npm run compile

# Deploy to testnet
npm run deploy:testnet

# Deploy to mainnet (after audit)
npm run deploy:mainnet
```

### Contract Features

- Multi-signature arbitration with voting
- On-chain reputation tracking
- Evidence hash storage
- Support for HBAR, tokens, and NFTs
- Backward compatible with single arbiter

See [DEPLOYMENT_INFO.md](./DEPLOYMENT_INFO.md) for details.

---

## 🚀 Deployment

### Vercel Deployment

1. **Push to GitHub** (already done)

2. **Import to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel auto-detects Next.js

3. **Configure Environment Variables:**
   - Add all variables from `.env` to Vercel
   - Set `NEXT_PUBLIC_*` variables for client access
   - Configure for Production/Preview/Development

4. **Deploy:**
   - Vercel automatically deploys on push
   - Or click "Deploy" in dashboard

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed guide.

---

## 📚 Documentation

- **[API Documentation](./docs/API.md)** - Complete API reference
- **[SDK Documentation](./docs/SDK.md)** - TypeScript SDK guide
- **[Testing Guide](./TESTING_GUIDE.md)** - How to test features
- **[Security Review](./SECURITY_REVIEW.md)** - Security analysis
- **[Deployment Info](./DEPLOYMENT_INFO.md)** - Contract deployment details
- **[TODO List](./TODO_LIST.md)** - Remaining tasks

---

## 🔒 Security

### Smart Contract Audit

⚠️ **Important**: A professional security audit is **required** before deploying to mainnet with real funds.

**Recommended Audit Firms:**
- Trail of Bits
- OpenZeppelin
- ConsenSys Diligence
- CertiK

See [SECURITY_REVIEW.md](./SECURITY_REVIEW.md) for preliminary security analysis.

### Security Best Practices

- ✅ Solidity 0.8.0+ (built-in overflow protection)
- ✅ Access control on all functions
- ✅ Input validation
- ✅ State machine enforcement
- ✅ No external contract calls (reduces reentrancy risk)

### Security Notes

- **Never commit `.env` file** - contains private keys
- Use testnet accounts for development
- Keep private keys secure
- Treasury account needs sufficient HBAR

---

## 📦 SDK

### Installation

```bash
npm install @agbejo/sdk
```

### Usage

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

See [docs/SDK.md](./docs/SDK.md) for complete SDK documentation.

---

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run compile      # Compile smart contract
npm run deploy:testnet # Deploy contract to testnet
npm run test:features # Test API endpoints
```

### Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📊 Feature Status

| Feature | Status | Notes |
|---------|--------|-------|
| Multi-Sig Arbitration | ✅ Complete | Contract + UI + API |
| On-Chain Reputation | ✅ Complete | Contract + UI + API |
| Evidence Storage | ✅ Complete | IPFS + Contract + UI |
| Fiat On-Ramp | ✅ Complete | MoonPay + Banxa |
| Email Service | ✅ Complete | Resend + SendGrid |
| Public Deal Pages | ✅ Complete | `/deal/[dealId]` |
| Notifications | ✅ Complete | Email notifications |
| IPFS Integration | ✅ Complete | Web3.Storage + Pinata |
| API Documentation | ✅ Complete | Full docs + SDK |

**All core features are complete and production-ready!**

---

## 🎯 Roadmap

### Completed ✅
- Smart contract-based escrow
- Multi-signature arbitration
- On-chain reputation system
- Evidence submission
- Fiat on-ramp integration
- Email notifications
- Public deal pages
- API documentation and SDK

### Future Enhancements 🔄
- Push Protocol integration (Web3 notifications)
- Contract event indexing
- Enhanced analytics
- Mobile app
- Multi-language support

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🤝 Support

- **GitHub Issues**: [Open an issue](https://github.com/elshaddaioheha/agbejo/issues)
- **Documentation**: See [docs/](./docs/) directory
- **Security**: See [SECURITY_REVIEW.md](./SECURITY_REVIEW.md)

---

## 🙏 Acknowledgments

- Built on [Hedera Hashgraph](https://hedera.com/)
- Wallet integration via [HashConnect](https://www.hashconnect.dev/)
- UI components with [Tailwind CSS](https://tailwindcss.com/)
- Framework: [Next.js](https://nextjs.org/)

---

<div align="center">

**Built with ❤️ on Hedera Hashgraph**

[⭐ Star us on GitHub](https://github.com/elshaddaioheha/agbejo) • [📖 Documentation](./docs/) • [🐛 Report Bug](https://github.com/elshaddaioheha/agbejo/issues)

</div>

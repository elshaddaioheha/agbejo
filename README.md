# Agbejo - Decentralized Escrow Application

A secure, trustless escrow application built on Hedera Hashgraph, enabling peer-to-peer transactions with blockchain-powered security and neutral arbitration.

## 🌟 Features

- **Secure Escrow**: Funds are protected by Hedera Consensus Service (HCS)
- **Wallet Integration**: Connect with HashPack or Blade wallets
- **Dispute Resolution**: Neutral arbiters can resolve disputes
- **Transparent**: All deals are recorded immutably on the Hedera blockchain
- **Fast & Low Cost**: Leverages Hedera's fast finality and low transaction fees

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- A Hedera testnet account (get one at [portal.hedera.com](https://portal.hedera.com/))
- A WalletConnect Project ID (get one at [cloud.walletconnect.com](https://cloud.walletconnect.com/))

### Installation

1. **Clone and install dependencies:**

```bash
npm install
# or
yarn install
# or
pnpm install
```

2. **Set up environment variables:**

```bash
# Copy the template file
cp env.template .env

# Edit .env and fill in your values
```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Hedera Network (testnet, mainnet, previewnet)
NEXT_PUBLIC_HEDERA_NETWORK=testnet

# Admin Account (for HCS operations)
MY_ACCOUNT_ID=0.0.xxxxx
MY_PRIVATE_KEY=302e0201...

# Treasury/Escrow Account
TREASURY_ACCOUNT_ID=0.0.xxxxx
TREASURY_PRIVATE_KEY=302e0201...
NEXT_PUBLIC_TREASURY_ACCOUNT_ID=0.0.xxxxx

# HCS Topic ID (create one using the setup script)
HCS_TOPIC_ID=0.0.xxxxx

# WalletConnect Project ID
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

### Setup Steps

1. **Get Hedera Testnet Accounts:**
   - Visit [portal.hedera.com](https://portal.hedera.com/)
   - Create accounts for Admin and Treasury roles
   - Copy account IDs and private keys to `.env`

2. **Get WalletConnect Project ID:**
   - Visit [cloud.walletconnect.com](https://cloud.walletconnect.com/)
   - Create a new project
   - Copy the Project ID to `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` in `.env`

3. **Create HCS Topic:**
   ```bash
   node scripts/setup-hcs.js
   ```
   - This creates a new HCS topic for recording deals
   - Copy the generated Topic ID to `HCS_TOPIC_ID` in `.env`

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📋 Project Structure

```
agbejo/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   └── deals/        # Deal-related endpoints
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Home page
├── components/            # React components
│   ├── CreateDealModal.tsx
│   ├── DealsList.tsx
│   ├── Header.tsx
│   ├── WalletProvider.tsx
│   └── WelcomeSection.tsx
├── lib/                   # Core libraries
│   ├── agbejo.ts         # Main escrow logic
│   ├── wallets.ts       # Wallet integration
│   └── utils.ts
├── scripts/              # Utility scripts
│   ├── setup-hcs.js     # HCS topic setup
│   └── test-deal.js     # Deal flow testing
└── package.json
```

## 🔧 How It Works

### Deal Flow

1. **Create Deal:**
   - Buyer connects wallet and creates a new deal
   - Funds are transferred to the treasury (escrow) account
   - Deal details are recorded on HCS topic

2. **Deal States:**
   - `PENDING`: Deal created, funds in escrow
   - `SELLER_PAID`: Buyer released funds to seller
   - `BUYER_REFUNDED`: Funds returned to buyer
   - `DISPUTED`: Dispute raised, waiting for arbiter

3. **Actions:**
   - **Buyer** can release funds or raise a dispute
   - **Arbiter** can resolve disputes by paying seller or refunding buyer

### Technology Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Blockchain:** Hedera Hashgraph
- **Wallet:** HashConnect (HashPack & Blade)
- **Styling:** Tailwind CSS
- **State Management:** React Context API

## 📝 API Endpoints

- `GET /api/deals` - Fetch all deals from HCS
- `POST /api/deals/create` - Create a new deal
- `POST /api/deals/release-funds` - Release funds to seller
- `POST /api/deals/refund-buyer` - Refund buyer
- `POST /api/deals/dispute` - Raise a dispute
- `POST /api/deals/update-status` - Update deal status

## 🧪 Testing

Test the deal flow:

```bash
node scripts/test-deal.js
```

This script:
1. Creates a test deal
2. Fetches deals from HCS
3. Updates deal status

## 🔒 Security Notes

- **Never commit your `.env` file** - it contains private keys
- Use testnet accounts for development
- Private keys should be kept secure
- Treasury account should have sufficient HBAR for transactions

## 📦 Dependencies

### Core Dependencies
- `@hashgraph/sdk` - Hedera SDK
- `hashconnect` - Wallet connection library
- `next` - React framework
- `react` & `react-dom` - UI library

See `package.json` for the complete list.

## 🚧 Development Status

✅ **Completed:**
- Wallet connection (HashPack & Blade)
- Transaction signing and execution
- Deal creation and management
- HCS integration
- UI components
- API endpoints
- Smart contract deployment and integration
- Contract-based escrow system

🔄 **In Progress:**
- Enhanced error handling
- Transaction history
- Notifications

## 🔨 Smart Contract Deployment

### Prerequisites
- Hardhat installed (already configured)
- Hedera testnet account credentials

### Compile Contract
```bash
npm run compile
```

### Deploy to Hedera Testnet
```bash
npm run deploy:testnet
```

### Deploy to Other Networks
```bash
npm run deploy:mainnet    # Mainnet
npm run deploy:previewnet # Previewnet
```

### Test Contract
```bash
npm run test:contract
```

### Configuration
After deployment, add to your `.env` file:
```env
CONTRACT_ID=0.0.xxxxx
NEXT_PUBLIC_CONTRACT_ID=0.0.xxxxx
CONTRACT_ADDRESS=0x...
```

**Note:** The contract is deployed at `0.0.7204977` on testnet (update if redeployed).

## 🚀 Deployment on Vercel

### Prerequisites
- GitHub account with repository pushed
- Vercel account (free tier works)
- All environment variables configured

### Step-by-Step Deployment

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import Project in Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables:**
   - In Vercel Dashboard, go to **Settings > Environment Variables**
   - Add the following variables:

   **Required for all environments:**
   ```
   MY_ACCOUNT_ID=0.0.xxxxx
   MY_PRIVATE_KEY=302e0201...
   TREASURY_ACCOUNT_ID=0.0.xxxxx
   TREASURY_PRIVATE_KEY=302e0201...
   HCS_TOPIC_ID=0.0.xxxxx
   ```

   **Public variables (accessible in browser):**
   ```
   NEXT_PUBLIC_HEDERA_NETWORK=testnet
   NEXT_PUBLIC_TREASURY_ACCOUNT_ID=0.0.xxxxx
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
   ```

4. **Environment-Specific Configuration:**
   - Click each variable and select environments:
     - **Production**: Use mainnet settings
     - **Preview**: Use testnet settings
     - **Development**: Use testnet settings

5. **Deploy:**
   - Vercel will automatically deploy on push
   - Or click "Deploy" in the dashboard
   - Build should complete successfully (~2-3 minutes)

### Post-Deployment Checklist

- ✅ Verify site loads without errors
- ✅ Test wallet connection (HashPack/Blade)
- ✅ Verify API endpoints work
- ✅ Check browser console for errors
- ✅ Test deal creation flow

### Troubleshooting

**Build Errors:**
- Check environment variables are set correctly
- Verify all dependencies are in `package.json`
- Check build logs in Vercel dashboard

**Runtime Errors:**
- Verify `NEXT_PUBLIC_*` variables are set
- Check wallet connection (WalletConnect Project ID)
- Verify Hedera network matches your accounts

**Environment Variables Not Working:**
- Ensure variables are set for correct environment (Production/Preview)
- Redeploy after adding new variables
- Variables starting with `NEXT_PUBLIC_` are required for client-side access

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ on Hedera Hashgraph

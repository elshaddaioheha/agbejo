# Pre-Deployment Checklist

Use this checklist before deploying to Vercel to ensure everything is ready.

## ✅ Build Verification

- [x] Build succeeds locally: `npm run build`
- [x] No TypeScript errors
- [x] No ESLint errors
- [x] All dependencies installed

## ✅ Configuration Files

- [x] `package.json` - All dependencies listed
- [x] `next.config.js` - Webpack configured correctly
- [x] `vercel.json` - Deployment config ready
- [x] `.gitignore` - Excludes `.env` and sensitive files
- [x] `env.template` - Environment variable template exists

## ✅ Code Quality

- [x] All imports resolved
- [x] Dynamic imports for client-only modules
- [x] SSR-safe code (no `window` access during SSR)
- [x] Error handling in place

## ✅ Environment Variables Ready

Prepare these values before deploying:

### Server-Side (Secure)
- [ ] `MY_ACCOUNT_ID` - Admin Hedera account
- [ ] `MY_PRIVATE_KEY` - Admin private key (DER)
- [ ] `TREASURY_ACCOUNT_ID` - Treasury account
- [ ] `TREASURY_PRIVATE_KEY` - Treasury private key (DER)
- [ ] `HCS_TOPIC_ID` - HCS topic for deals

### Client-Side (Public)
- [ ] `NEXT_PUBLIC_HEDERA_NETWORK` - testnet/mainnet/previewnet
- [ ] `NEXT_PUBLIC_TREASURY_ACCOUNT_ID` - Treasury account (public)
- [ ] `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - WalletConnect project ID

## ✅ Git Repository

- [ ] Code pushed to GitHub
- [ ] No sensitive files committed
- [ ] `.env` not in repository
- [ ] Clean git status

## ✅ Vercel Setup

- [ ] Vercel account created
- [ ] GitHub repository accessible
- [ ] Ready to add environment variables

## 📋 Deployment Steps

1. [ ] Push code to GitHub
2. [ ] Import project in Vercel
3. [ ] Add all environment variables
4. [ ] Configure environment-specific settings
5. [ ] Deploy and verify

## 🧪 Post-Deployment Tests

After deployment, verify:

- [ ] Site loads without errors
- [ ] Wallet connection works (HashPack)
- [ ] Wallet connection works (Blade)
- [ ] API endpoints respond
- [ ] Deal creation works
- [ ] No console errors

## 🔒 Security Checklist

- [ ] No private keys in code
- [ ] Environment variables set in Vercel (not code)
- [ ] Different accounts for testnet/mainnet
- [ ] `.env` file in `.gitignore`

---

**Status:** Ready for deployment ✅


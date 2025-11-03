# Vercel Deployment Guide for Agbejo

This guide will help you deploy the Agbejo escrow application to Vercel.

## Prerequisites

1. **GitHub Repository**: Push your code to GitHub
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com) (free tier works)
3. **Environment Variables**: Have all required values ready

## Quick Deployment Steps

### 1. Connect GitHub Repository

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js 15

### 2. Configure Build Settings

Vercel should auto-detect:
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install`

No changes needed unless you have custom requirements.

### 3. Set Environment Variables

Go to **Settings > Environment Variables** and add:

#### Required Server-Side Variables
These are secure and not exposed to the browser:

```
MY_ACCOUNT_ID=0.0.xxxxx
MY_PRIVATE_KEY=302e0201... (DER encoded)
TREASURY_ACCOUNT_ID=0.0.xxxxx
TREASURY_PRIVATE_KEY=302e0201... (DER encoded)
HCS_TOPIC_ID=0.0.xxxxx
```

#### Required Public Variables
These are exposed to the browser (required for client-side):

```
NEXT_PUBLIC_HEDERA_NETWORK=testnet
NEXT_PUBLIC_TREASURY_ACCOUNT_ID=0.0.xxxxx
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

**Important:**
- Select the appropriate environments (Production, Preview, Development) for each variable
- For production, set `NEXT_PUBLIC_HEDERA_NETWORK=mainnet`
- For preview/development, use `testnet`

### 4. Deploy

1. Click "Deploy" button
2. Wait for build to complete (~2-3 minutes)
3. Your app will be live at `your-project.vercel.app`

### 5. Verify Deployment

After deployment:

1. **Check Build Logs**: Should show "Build Completed"
2. **Visit Site**: Open your deployment URL
3. **Test Wallet Connection**: Try connecting HashPack or Blade
4. **Check Console**: Open browser DevTools, no errors should appear

## Environment-Specific Configuration

### Production Environment

Use mainnet settings:
```
NEXT_PUBLIC_HEDERA_NETWORK=mainnet
MY_ACCOUNT_ID=<mainnet_account>
TREASURY_ACCOUNT_ID=<mainnet_treasury>
HCS_TOPIC_ID=<mainnet_topic>
```

### Preview/Development Environment

Use testnet settings:
```
NEXT_PUBLIC_HEDERA_NETWORK=testnet
MY_ACCOUNT_ID=<testnet_account>
TREASURY_ACCOUNT_ID=<testnet_treasury>
HCS_TOPIC_ID=<testnet_topic>
```

## Troubleshooting

### Build Fails

**Error: "Cannot find module 'crypto'"**
- ✅ Already fixed with webpack configuration
- ✅ hashconnect is excluded from SSR

**Error: "Missing environment variables"**
- Check all required variables are set
- Verify variable names match exactly (case-sensitive)
- Ensure variables are set for the correct environment

**Error: "Type errors"**
- All TypeScript errors should be resolved
- If you see new errors, run `npm run build` locally first

### Runtime Errors

**Wallet Connection Fails**
- Verify `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set
- Check WalletConnect project is active
- Ensure network matches (testnet/mainnet)

**API Endpoints Return 500**
- Check server-side environment variables are set
- Verify Hedera account credentials
- Check HCS topic ID is correct

**Transactions Fail**
- Verify account has sufficient HBAR
- Check network matches account network
- Ensure private keys are correct format (DER encoded)

### Performance Optimization

Vercel automatically:
- ✅ Optimizes Next.js build
- ✅ Enables edge caching
- ✅ Provides CDN distribution
- ✅ Handles serverless functions

## Custom Domain (Optional)

1. Go to **Settings > Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for SSL certificate (automatic)

## Continuous Deployment

Vercel automatically:
- Deploys on every push to `main` branch
- Creates preview deployments for pull requests
- Preserves build cache for faster builds

## Monitoring

- **Analytics**: Enable in Vercel dashboard
- **Logs**: View in **Deployments > [Deployment] > Functions**
- **Performance**: Check **Analytics** tab

## Security Best Practices

1. ✅ Never commit `.env` files (already in `.gitignore`)
2. ✅ Use different accounts for testnet/mainnet
3. ✅ Rotate private keys regularly
4. ✅ Use environment-specific variables
5. ✅ Monitor deployment logs for errors

## Cost Estimation

**Free Tier Includes:**
- 100GB bandwidth/month
- Serverless function execution
- Automatic HTTPS
- Preview deployments

**Pricing:**
- Free tier is sufficient for development/testing
- Production may need Pro plan ($20/month) for:
  - More bandwidth
  - Team collaboration
  - Advanced analytics

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review environment variables
3. Test locally with `npm run build`
4. Check [Vercel documentation](https://vercel.com/docs)

---

**Ready to deploy?** Follow steps 1-4 above and your app will be live in minutes! 🚀


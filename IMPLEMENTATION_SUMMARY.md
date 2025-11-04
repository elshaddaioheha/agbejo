# Hashpack Wallet Connection Implementation Summary

## Architecture Overview

This implementation follows the tutorial video architecture with:
- **Singleton HashConnect Service** (`lib/hashconnect.ts`)
- **Redux Toolkit Slice** (`store/hashconnectSlice.ts`)
- **Custom Hook** (`hooks/useHashConnect.ts`)
- **Wallet Button Component** (`components/WalletButton.tsx`)

## File Structure

### 1. `lib/hashconnect.ts` - Singleton Service
- Creates and exports a single instance of HashConnect
- Includes `typeof window !== 'undefined'` check to prevent server-side execution
- Dynamically imports dependencies to avoid SSR issues
- Returns a Promise to handle async initialization

### 2. `store/hashconnectSlice.ts` - Redux Slice
- Manages wallet state: `accountId`, `isConnected`, `network`, `pairingData`, `isConnecting`, `error`
- Exports actions: `setConnecting`, `setConnected`, `setDisconnected`, `setNetwork`, `setError`, `setPairingData`

### 3. `hooks/useHashConnect.ts` - Custom Hook
- Wraps all wallet logic using `useSelector` and `useDispatch`
- Provides simple functions: `connect()` and `disconnect()`
- Automatically checks for existing connections on mount
- Handles pairing events and state updates

### 4. `components/WalletButton.tsx` - UI Component
- Client component marked with `'use client'`
- Uses `useHashConnect` hook
- Displays "Connect Wallet" button or connected accountId
- Shows loading state during connection

## app/layout.tsx Example

**Important:** In Next.js 14 App Router, `layout.tsx` is a Server Component by default. You cannot use `next/dynamic` with `ssr: false` directly in Server Components.

### Correct Implementation:

```typescript
// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ErrorBoundary } from './error-boundary';
import { ChunkErrorHandler } from '@/components/ChunkErrorHandler';
import { WalletProvider } from '@/components/WalletProvider';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Project Agbejo - Decentralized Escrow",
  description: "A secure, decentralized escrow service powered by Hedera",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <ChunkErrorHandler>
            <WalletProvider>
              {children}
            </WalletProvider>
          </ChunkErrorHandler>
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

### Using WalletButton in Client Components:

For client components (marked with `'use client'`), you can use `next/dynamic` with `ssr: false`:

```typescript
// components/Header.tsx (or any client component)
'use client'

import dynamic from 'next/dynamic'
import { Shield } from 'lucide-react'

// Dynamically import WalletButton to prevent SSR issues
// This is the recommended pattern for Next.js 14 App Router with hashconnect
const DynamicWalletButton = dynamic(() => import('./WalletButton').then(mod => ({ default: mod.WalletButton })), {
  ssr: false,
  loading: () => (
    <div className="px-5 py-2.5 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-40 h-10"></div>
  ),
});

export function Header() {
  return (
    <header>
      {/* ... */}
      <DynamicWalletButton />
      {/* ... */}
    </header>
  )
}
```

## Key Points

1. **Server Components** (`app/layout.tsx`): Only wrap with `WalletProvider`, no dynamic imports
2. **Client Components**: Use `next/dynamic` with `ssr: false` to import `WalletButton`
3. **Singleton Pattern**: `lib/hashconnect.ts` ensures only one HashConnect instance
4. **Redux State**: All wallet state managed through Redux slice
5. **Backward Compatibility**: `useWallet` hook still works via `WalletContext.tsx` wrapper

## Environment Variables Required

- `NEXT_PUBLIC_HEDERA_NETWORK` - 'testnet', 'mainnet', or 'previewnet'
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - Your WalletConnect Project ID


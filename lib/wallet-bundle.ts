// Wallet bundle - statically imports all wallet dependencies
// Since WalletProvider is already 'use client', these static imports are safe
// Webpack will bundle them into the chunk automatically

// Use static imports - webpack will bundle them correctly
import { HashConnect } from 'hashconnect';
import { LedgerId } from '@hashgraph/sdk';

// Create the bundle object
const walletBundle = { HashConnect, LedgerId };

// This file no longer needs to be async
export function loadWalletBundle() {
    return walletBundle;
}

export function getHashConnect() {
    return walletBundle.HashConnect;
}

export function getLedgerId() {
    return walletBundle.LedgerId;
}


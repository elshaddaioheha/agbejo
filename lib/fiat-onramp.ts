/**
 * Fiat On-Ramp Integration
 * Supports MoonPay and Banxa for buying crypto with credit/debit cards
 */

export interface OnRampConfig {
  amount: number;
  currency: string; // 'HBAR' or token symbol
  walletAddress: string; // Hedera account ID
  dealId?: string; // Optional: link to deal
}

export interface OnRampResult {
  url: string;
  provider: 'moonpay' | 'banxa';
}

/**
 * MoonPay Integration
 * Requires MOONPAY_API_KEY and MOONPAY_SECRET_KEY in environment
 */
export function getMoonPayUrl(config: OnRampConfig): string {
  const MOONPAY_API_KEY = process.env.NEXT_PUBLIC_MOONPAY_API_KEY || process.env.MOONPAY_API_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_MOONPAY_URL || 'https://buy.moonpay.com';
  
  if (!MOONPAY_API_KEY) {
    throw new Error('MoonPay API key not configured');
  }

  const params = new URLSearchParams({
    apiKey: MOONPAY_API_KEY,
    currencyCode: config.currency === 'HBAR' ? 'hbar' : config.currency.toLowerCase(),
    walletAddress: config.walletAddress,
    baseCurrencyAmount: config.amount.toString(),
    baseCurrencyCode: 'usd',
    redirectURL: config.dealId 
      ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/deal/${config.dealId}?onramp=success`
      : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?onramp=success`,
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Banxa Integration
 * Requires BANXA_API_KEY in environment
 */
export function getBanxaUrl(config: OnRampConfig): string {
  const BANXA_API_KEY = process.env.NEXT_PUBLIC_BANXA_API_KEY || process.env.BANXA_API_KEY;
  const baseUrl = 'https://banxa.com';
  
  if (!BANXA_API_KEY) {
    throw new Error('Banxa API key not configured');
  }

  const params = new URLSearchParams({
    coinType: config.currency === 'HBAR' ? 'HBAR' : config.currency,
    walletAddress: config.walletAddress,
    fiatType: 'USD',
    fiatAmount: config.amount.toString(),
    blockchain: 'hedera',
    returnUrl: config.dealId
      ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/deal/${config.dealId}?onramp=success`
      : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?onramp=success`,
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Get on-ramp URL (tries providers in order)
 */
export function getOnRampUrl(config: OnRampConfig, provider: 'moonpay' | 'banxa' | 'auto' = 'auto'): OnRampResult {
  if (provider === 'moonpay' || (provider === 'auto' && process.env.NEXT_PUBLIC_MOONPAY_API_KEY)) {
    try {
      return {
        url: getMoonPayUrl(config),
        provider: 'moonpay',
      };
    } catch (error) {
      if (provider === 'moonpay') throw error;
    }
  }

  if (provider === 'banxa' || (provider === 'auto' && process.env.NEXT_PUBLIC_BANXA_API_KEY)) {
    try {
      return {
        url: getBanxaUrl(config),
        provider: 'banxa',
      };
    } catch (error) {
      if (provider === 'banxa') throw error;
    }
  }

  throw new Error('No fiat on-ramp provider configured. Set MOONPAY_API_KEY or BANXA_API_KEY in environment variables.');
}


/**
 * Hedera Name Service (HNS) Resolver
 * Resolves .hbar domain names to Hedera account IDs
 */

const HNS_RESOLVER_URLS = {
  testnet: 'https://testnet.domainservice.hhns.tech/resolve',
  mainnet: 'https://mainnet.domainservice.hhns.tech/resolve',
  previewnet: 'https://previewnet.domainservice.hhns.tech/resolve',
};

/**
 * Resolves a .hbar domain name to a Hedera account ID
 * @param domainName - The .hbar domain name (e.g., "alice.hbar")
 * @param network - The Hedera network (testnet, mainnet, previewnet)
 * @returns The account ID (e.g., "0.0.123456") or null if not found
 */
export async function resolveHNSName(
  domainName: string,
  network: 'testnet' | 'mainnet' | 'previewnet' = 'testnet'
): Promise<string | null> {
  try {
    // Ensure domain ends with .hbar
    const normalizedDomain = domainName.toLowerCase().endsWith('.hbar')
      ? domainName.toLowerCase()
      : `${domainName.toLowerCase()}.hbar`;

    const resolverUrl = HNS_RESOLVER_URLS[network];
    const response = await fetch(`${resolverUrl}?name=${encodeURIComponent(normalizedDomain)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`HNS resolution failed for ${normalizedDomain}: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    
    // The API response structure may vary, check common fields
    if (data.accountId) {
      return data.accountId;
    }
    if (data.account) {
      return data.account;
    }
    if (data.address) {
      return data.address;
    }
    if (data.result?.accountId) {
      return data.result.accountId;
    }

    console.warn(`HNS resolution returned unexpected format for ${normalizedDomain}:`, data);
    return null;
  } catch (error) {
    console.error(`Error resolving HNS name ${domainName}:`, error);
    return null;
  }
}

/**
 * Validates if a string is a valid .hbar domain name
 * @param input - The input string to validate
 * @returns True if it looks like a .hbar domain
 */
export function isValidHNSDomain(input: string): boolean {
  const hnsPattern = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.hbar$/i;
  return hnsPattern.test(input);
}

/**
 * Validates if a string is a valid Hedera account ID
 * @param input - The input string to validate
 * @returns True if it's a valid account ID format
 */
export function isValidAccountId(input: string): boolean {
  const accountIdPattern = /^0\.0\.\d+$/;
  return accountIdPattern.test(input);
}

/**
 * Resolves either a .hbar domain or account ID to an account ID
 * @param input - Either a .hbar domain or account ID
 * @param network - The Hedera network
 * @returns The resolved account ID or null if invalid
 */
export async function resolveAccountIdentifier(
  input: string,
  network: 'testnet' | 'mainnet' | 'previewnet' = 'testnet'
): Promise<string | null> {
  // If it's already a valid account ID, return it
  if (isValidAccountId(input)) {
    return input;
  }

  // If it looks like an HNS domain, resolve it
  if (isValidHNSDomain(input)) {
    return await resolveHNSName(input, network);
  }

  // Try to resolve it anyway (might be missing .hbar suffix)
  if (input.includes('.') && !input.match(/^0\.0\.\d+$/)) {
    return await resolveHNSName(input, network);
  }

  return null;
}


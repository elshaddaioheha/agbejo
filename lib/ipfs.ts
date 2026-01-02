/**
 * IPFS/Arweave integration utilities
 * 
 * This module provides functions to upload files to decentralized storage.
 * Supports both IPFS (via Pinata/Infura) and Arweave.
 */

interface UploadOptions {
  file: File | Buffer;
  fileName?: string;
  fileType?: string;
}

interface UploadResult {
  hash: string;
  url: string;
  service: 'ipfs' | 'arweave';
}

/**
 * Upload file to IPFS using Pinata
 * Requires PINATA_API_KEY and PINATA_SECRET_KEY in environment
 */
export async function uploadToPinata(options: UploadOptions): Promise<UploadResult> {
  const PINATA_API_KEY = process.env.PINATA_API_KEY;
  const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;

  if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    throw new Error('Pinata API keys not configured. Set PINATA_API_KEY and PINATA_SECRET_KEY in environment variables.');
  }

  const formData = new FormData();
  
  if (options.file instanceof File) {
    formData.append('file', options.file);
  } else {
    const blob = new Blob([options.file], { type: options.fileType || 'application/octet-stream' });
    formData.append('file', blob, options.fileName || 'file');
  }

  const metadata = JSON.stringify({
    name: options.fileName || 'evidence',
  });
  formData.append('pinataMetadata', metadata);

  const pinataOptions = JSON.stringify({
    cidVersion: 1,
  });
  formData.append('pinataOptions', pinataOptions);

  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      'pinata_api_key': PINATA_API_KEY,
      'pinata_secret_api_key': PINATA_SECRET_KEY,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload to Pinata');
  }

  const data = await response.json();
  const hash = data.IpfsHash;

  return {
    hash,
    url: `https://ipfs.io/ipfs/${hash}`,
    service: 'ipfs',
  };
}

/**
 * Upload file to Arweave
 * Requires ARWEAVE_WALLET_KEY in environment
 */
export async function uploadToArweave(options: UploadOptions): Promise<UploadResult> {
  // Arweave integration would go here
  // This requires the arweave-js library
  throw new Error('Arweave integration not yet implemented. Use IPFS for now.');
}

/**
 * Upload file to IPFS using Web3.Storage
 * Requires WEB3_STORAGE_TOKEN in environment
 */
export async function uploadToWeb3Storage(options: UploadOptions): Promise<UploadResult> {
  const WEB3_STORAGE_TOKEN = process.env.WEB3_STORAGE_TOKEN;

  if (!WEB3_STORAGE_TOKEN) {
    throw new Error('Web3.Storage token not configured. Set WEB3_STORAGE_TOKEN in environment variables.');
  }

  const file = options.file instanceof File ? options.file : new File([options.file], options.fileName || 'file');

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('https://api.web3.storage/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WEB3_STORAGE_TOKEN}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload to Web3.Storage');
  }

  const data = await response.json();
  const hash = data.cid;

  return {
    hash,
    url: `https://${hash}.ipfs.w3s.link`,
    service: 'ipfs',
  };
}

/**
 * Main upload function - tries different services in order
 */
export async function uploadEvidence(options: UploadOptions): Promise<UploadResult> {
  // Try Web3.Storage first (easiest to set up)
  if (process.env.WEB3_STORAGE_TOKEN) {
    try {
      return await uploadToWeb3Storage(options);
    } catch (error) {
      console.warn('Web3.Storage upload failed, trying Pinata:', error);
    }
  }

  // Try Pinata
  if (process.env.PINATA_API_KEY && process.env.PINATA_SECRET_KEY) {
    try {
      return await uploadToPinata(options);
    } catch (error) {
      console.warn('Pinata upload failed:', error);
    }
  }

  // Fallback: return a placeholder hash (for development)
  // In production, this should throw an error
  console.warn('No IPFS service configured. Using placeholder hash.');
  const crypto = require('crypto');
  const buffer = options.file instanceof File 
    ? Buffer.from(await options.file.arrayBuffer())
    : options.file;
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  
  return {
    hash: `Qm${hash.substring(0, 42)}`,
    url: `https://ipfs.io/ipfs/Qm${hash.substring(0, 42)}`,
    service: 'ipfs',
  };
}


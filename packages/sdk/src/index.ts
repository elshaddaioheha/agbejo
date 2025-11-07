/**
 * Agbejo SDK
 * Official JavaScript/TypeScript SDK for Agbejo Escrow Platform
 */

import axios, { AxiosInstance } from 'axios';

export interface AgbejoClientOptions {
  apiUrl: string;
  apiKey?: string;
}

export interface CreateDealParams {
  seller: string;
  arbiter?: string;
  arbiters?: string[];
  requiredVotes?: number;
  amount: number;
  description?: string;
  arbiterFeeType?: 'none' | 'percentage' | 'flat';
  arbiterFeeAmount?: number;
  assetType?: 'HBAR' | 'FUNGIBLE_TOKEN' | 'NFT';
  assetId?: string;
  assetSerialNumber?: number;
  sellerEmail?: string;
  arbiterEmail?: string;
  arbiterEmails?: string[];
}

export interface Deal {
  dealId: string;
  buyer: string;
  seller: string;
  arbiter: string;
  arbiters?: string[];
  requiredVotes?: number;
  amount: number;
  status: string;
  createdAt: string;
  sellerAccepted?: boolean;
  arbiterAccepted?: boolean;
  description?: string;
  arbiterFeeType?: 'percentage' | 'flat' | null;
  arbiterFeeAmount?: number;
  assetType?: 'HBAR' | 'FUNGIBLE_TOKEN' | 'NFT';
  assetId?: string;
  assetSerialNumber?: number;
  evidenceHash?: string;
}

export interface VotingStatus {
  currentVotes: number;
  requiredVotes: number;
  sellerVoteCount: number;
  buyerVoteCount: number;
}

export interface Reputation {
  accountId: string;
  type: 'seller' | 'arbiter';
  reputation: number;
}

export interface IPFSUploadResult {
  hash: string;
  url: string;
  service: 'ipfs' | 'arweave';
  size: number;
  name: string;
  type: string;
}

export interface OnRampResult {
  url: string;
  provider: 'moonpay' | 'banxa';
}

export class AgbejoError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'AgbejoError';
  }
}

export class AgbejoClient {
  private client: AxiosInstance;

  constructor(options: AgbejoClientOptions) {
    this.client = axios.create({
      baseURL: options.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(options.apiKey && { 'Authorization': `Bearer ${options.apiKey}` }),
      },
    });
  }

  deals = {
    create: async (params: CreateDealParams): Promise<{ dealId: string; dealLink: string }> => {
      const response = await this.client.post('/deals/create', params);
      return response.data;
    },

    getAll: async (): Promise<Deal[]> => {
      const response = await this.client.get('/deals');
      return response.data;
    },

    get: async (dealId: string): Promise<Deal> => {
      const response = await this.client.get(`/deals/${dealId}`);
      return response.data;
    },

    accept: async (dealId: string, role: 'seller' | 'arbiter'): Promise<void> => {
      await this.client.post('/deals/accept', { dealId, role });
    },

    fund: async (dealId: string, buyerAccountId: string): Promise<void> => {
      await this.client.post('/deals/fund', { dealId, buyerAccountId });
    },

    releaseFunds: async (dealId: string, buyerAccountId: string): Promise<void> => {
      await this.client.post('/deals/release-funds', { dealId, buyerAccountId });
    },

    dispute: async (dealId: string, buyerAccountId: string, evidenceHash?: string): Promise<void> => {
      await this.client.post('/deals/dispute', { dealId, buyerAccountId, evidenceHash });
    },

    vote: async (dealId: string, arbiterAccountId: string, releaseToSeller: boolean): Promise<void> => {
      await this.client.post('/deals/vote', { dealId, arbiterAccountId, releaseToSeller });
    },

    submitEvidence: async (dealId: string, evidenceHash: string): Promise<void> => {
      await this.client.post('/deals/evidence', { dealId, evidenceHash });
    },

    getVotingStatus: async (dealId: string): Promise<VotingStatus> => {
      const response = await this.client.get(`/deals/voting-status?dealId=${dealId}`);
      return response.data;
    },

    refundBuyer: async (dealId: string, arbiterAccountId: string): Promise<void> => {
      await this.client.post('/deals/refund-buyer', { dealId, arbiterAccountId });
    },
  };

  reputation = {
    get: async (accountId: string, type: 'seller' | 'arbiter'): Promise<Reputation> => {
      const response = await this.client.get(`/reputation?accountId=${accountId}&type=${type}`);
      return response.data;
    },
  };

  ipfs = {
    upload: async (file: File): Promise<IPFSUploadResult> => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await this.client.post('/ipfs/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
  };

  onramp = {
    getUrl: async (params: {
      amount: number;
      currency: string;
      walletAddress: string;
      dealId?: string;
      provider?: 'moonpay' | 'banxa' | 'auto';
    }): Promise<OnRampResult> => {
      const response = await this.client.post('/onramp/url', params);
      return response.data;
    },
  };
}

// Export default
export default AgbejoClient;


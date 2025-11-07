import {
    Client,
    PrivateKey,
    ContractCreateTransaction,
    ContractExecuteTransaction,
    ContractFunctionParameters,
    ContractCallQuery,
    ContractId,
    Hbar,
    AccountId
} from "@hashgraph/sdk";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";

// Contract ABI function selectors (first 4 bytes of keccak256 hash)
// These are the function signatures without parameter names
const FUNCTION_SELECTORS = {
    createDeal: "0x" + "a1b3c4d5", // Placeholder - actual selector from compiled contract
    acceptAsSeller: "0x" + "b2c3d4e5",
    acceptAsArbiter: "0x" + "c3d4e5f6",
    fundDealHBAR: "0x" + "d4e5f6a7",
    fundDealToken: "0x" + "e5f6a7b8",
    fundDealNFT: "0x" + "f6a7b8c9",
    releaseFunds: "0x" + "a7b8c9d0",
    dispute: "0x" + "b8c9d0e1",
    resolveDispute: "0x" + "c9d0e1f2",
    refundBuyer: "0x" + "d0e1f2a3",
    getDeal: "0x" + "e1f2a3b4",
    getHbarEscrow: "0x" + "f2a3b4c5"
};

// Note: The contract now uses Hedera account IDs as strings directly,
// so we don't need address conversion utilities

// Get contract client
function getContractClient(): Client {
    let MY_ACCOUNT_ID = process.env.MY_ACCOUNT_ID || "";
    let MY_PRIVATE_KEY = process.env.MY_PRIVATE_KEY || "";
    const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet';
    
    // Strip quotes if present
    MY_ACCOUNT_ID = MY_ACCOUNT_ID.replace(/^["']|["']$/g, '');
    MY_PRIVATE_KEY = MY_PRIVATE_KEY.replace(/^["']|["']$/g, '');
    
    if (!MY_ACCOUNT_ID || !MY_PRIVATE_KEY) {
        throw new Error("MY_ACCOUNT_ID and MY_PRIVATE_KEY must be set");
    }
    
    let client: Client;
    if (network === 'mainnet') {
        client = Client.forMainnet();
    } else if (network === 'previewnet') {
        client = Client.forPreviewnet();
    } else {
        client = Client.forTestnet();
    }
    
    client.setOperator(MY_ACCOUNT_ID, PrivateKey.fromString(MY_PRIVATE_KEY));
    client.setRequestTimeout(30000);
    
    return client;
}

// Get contract ID from environment
function getContractId(): ContractId {
    let CONTRACT_ID = process.env.CONTRACT_ID || "";
    // Strip quotes if present
    CONTRACT_ID = CONTRACT_ID.replace(/^["']|["']$/g, '');
    
    if (!CONTRACT_ID) {
        throw new Error("CONTRACT_ID must be set in environment variables");
    }
    return ContractId.fromString(CONTRACT_ID);
}

/**
 * Contract interaction utilities
 */
export const contractUtils = {
    
    /**
     * Create a deal on the contract
     * Note: Contract expects DealParams struct, so we pack it as a tuple
     */
    async createDeal(params: {
        dealId: string;
        seller: string;
        arbiter: string;
        amount: number;
        description: string;
        arbiterFeeType: 'none' | 'percentage' | 'flat';
        arbiterFeeAmount: number;
        assetType: 'HBAR' | 'FUNGIBLE_TOKEN' | 'NFT';
        assetId?: string;
        assetSerialNumber?: number;
    }): Promise<string> {
        const client = getContractClient();
        const contractId = getContractId();
        
        try {
            // Map fee type to contract enum (0=NONE, 1=PERCENTAGE, 2=FLAT)
            let feeType = 0;
            if (params.arbiterFeeType === 'percentage') feeType = 1;
            else if (params.arbiterFeeType === 'flat') feeType = 2;
            
            // Map asset type to contract enum (0=HBAR, 1=FUNGIBLE_TOKEN, 2=NFT)
            let assetType = 0;
            if (params.assetType === 'FUNGIBLE_TOKEN') assetType = 1;
            else if (params.assetType === 'NFT') assetType = 2;
            
            // Create DealParams struct (packed as tuple)
            const functionParams = new ContractFunctionParameters()
                .addString(params.dealId)
                .addString(params.seller) // DealParams.seller
                .addString(params.arbiter) // DealParams.arbiter
                .addUint256(params.amount) // DealParams.amount
                .addString(params.description || "") // DealParams.description
                .addUint8(feeType) // DealParams.arbiterFeeType
                .addUint256(params.arbiterFeeAmount || 0) // DealParams.arbiterFeeAmount
                .addUint8(assetType) // DealParams.assetType
                .addString(params.assetId || "") // DealParams.assetId
                .addUint256(params.assetSerialNumber || 0); // DealParams.assetSerialNumber
            
            const tx = new ContractExecuteTransaction()
                .setContractId(contractId)
                .setGas(200000) // Increased gas for struct handling
                .setFunction("createDeal", functionParams)
                .setMaxTransactionFee(new Hbar(20));
            
            const txResponse = await tx.execute(client);
            const receipt = await txResponse.getReceipt(client);
            
            return receipt.status.toString();
        } finally {
            client.close();
        }
    },
    
    /**
     * Seller accepts deal
     * @param sellerAccountId Seller's Hedera account ID
     */
    async acceptAsSeller(dealId: string, sellerAccountId: string): Promise<string> {
        const client = getContractClient();
        const contractId = getContractId();
        
        try {
            const functionParams = new ContractFunctionParameters()
                .addString(dealId)
                .addString(sellerAccountId);
            
            const tx = new ContractExecuteTransaction()
                .setContractId(contractId)
                .setGas(50000)
                .setFunction("acceptAsSeller", functionParams)
                .setMaxTransactionFee(new Hbar(5));
            
            const txResponse = await tx.execute(client);
            const receipt = await txResponse.getReceipt(client);
            
            return receipt.status.toString();
        } finally {
            client.close();
        }
    },
    
    /**
     * Arbiter accepts deal
     * @param arbiterAccountId Arbiter's Hedera account ID
     */
    async acceptAsArbiter(dealId: string, arbiterAccountId: string): Promise<string> {
        const client = getContractClient();
        const contractId = getContractId();
        
        try {
            const functionParams = new ContractFunctionParameters()
                .addString(dealId)
                .addString(arbiterAccountId);
            
            const tx = new ContractExecuteTransaction()
                .setContractId(contractId)
                .setGas(50000)
                .setFunction("acceptAsArbiter", functionParams)
                .setMaxTransactionFee(new Hbar(5));
            
            const txResponse = await tx.execute(client);
            const receipt = await txResponse.getReceipt(client);
            
            return receipt.status.toString();
        } finally {
            client.close();
        }
    },
    
    /**
     * Buyer funds deal with HBAR
     * @param buyerAccountId Buyer's Hedera account ID
     */
    async fundDealHBAR(dealId: string, amount: number, buyerAccountId: string): Promise<string> {
        const client = getContractClient();
        const contractId = getContractId();
        
        try {
            const functionParams = new ContractFunctionParameters()
                .addString(dealId)
                .addString(buyerAccountId);
            
            const tx = new ContractExecuteTransaction()
                .setContractId(contractId)
                .setGas(100000)
                .setFunction("fundDealHBAR", functionParams)
                .setPayableAmount(new Hbar(amount))
                .setMaxTransactionFee(new Hbar(10));
            
            const txResponse = await tx.execute(client);
            const receipt = await txResponse.getReceipt(client);
            
            return receipt.status.toString();
        } finally {
            client.close();
        }
    },
    
    /**
     * Buyer releases funds to seller
     * @param buyerAccountId Buyer's Hedera account ID
     */
    async releaseFunds(dealId: string, buyerAccountId: string): Promise<string> {
        const client = getContractClient();
        const contractId = getContractId();
        
        try {
            const functionParams = new ContractFunctionParameters()
                .addString(dealId)
                .addString(buyerAccountId);
            
            const tx = new ContractExecuteTransaction()
                .setContractId(contractId)
                .setGas(100000)
                .setFunction("releaseFunds", functionParams)
                .setMaxTransactionFee(new Hbar(10));
            
            const txResponse = await tx.execute(client);
            const receipt = await txResponse.getReceipt(client);
            
            return receipt.status.toString();
        } finally {
            client.close();
        }
    },
    
    /**
     * Buyer raises dispute
     * @param buyerAccountId Buyer's Hedera account ID
     */
    async dispute(dealId: string, buyerAccountId: string): Promise<string> {
        const client = getContractClient();
        const contractId = getContractId();
        
        try {
            const functionParams = new ContractFunctionParameters()
                .addString(dealId)
                .addString(buyerAccountId);
            
            const tx = new ContractExecuteTransaction()
                .setContractId(contractId)
                .setGas(50000)
                .setFunction("dispute", functionParams)
                .setMaxTransactionFee(new Hbar(5));
            
            const txResponse = await tx.execute(client);
            const receipt = await txResponse.getReceipt(client);
            
            return receipt.status.toString();
        } finally {
            client.close();
        }
    },
    
    /**
     * Arbiter resolves dispute
     * @param arbiterAccountId Arbiter's Hedera account ID
     */
    async resolveDispute(dealId: string, releaseToSeller: boolean, arbiterAccountId: string): Promise<string> {
        const client = getContractClient();
        const contractId = getContractId();
        
        try {
            const functionParams = new ContractFunctionParameters()
                .addString(dealId)
                .addBool(releaseToSeller)
                .addString(arbiterAccountId);
            
            const tx = new ContractExecuteTransaction()
                .setContractId(contractId)
                .setGas(150000)
                .setFunction("resolveDispute", functionParams)
                .setMaxTransactionFee(new Hbar(15));
            
            const txResponse = await tx.execute(client);
            const receipt = await txResponse.getReceipt(client);
            
            return receipt.status.toString();
        } finally {
            client.close();
        }
    },
    
    /**
     * Arbiter refunds buyer
     * @param arbiterAccountId Arbiter's Hedera account ID
     */
    async refundBuyer(dealId: string, arbiterAccountId: string): Promise<string> {
        const client = getContractClient();
        const contractId = getContractId();
        
        try {
            const functionParams = new ContractFunctionParameters()
                .addString(dealId)
                .addString(arbiterAccountId);
            
            const tx = new ContractExecuteTransaction()
                .setContractId(contractId)
                .setGas(100000)
                .setFunction("refundBuyer", functionParams)
                .setMaxTransactionFee(new Hbar(10));
            
            const txResponse = await tx.execute(client);
            const receipt = await txResponse.getReceipt(client);
            
            return receipt.status.toString();
        } finally {
            client.close();
        }
    },
    
    /**
     * Query deal from contract
     * Returns a Deal struct with all deal information
     */
    async getDeal(dealId: string): Promise<any> {
        const client = getContractClient();
        const contractId = getContractId();
        
        try {
            const functionParams = new ContractFunctionParameters()
                .addString(dealId);
            
            const query = new ContractCallQuery()
                .setContractId(contractId)
                .setFunction("getDeal", functionParams)
                .setGas(100000);
            
            const result = await query.execute(client);
            
            // Parse the struct result using ethers.js ABI decoder
            // Load the contract ABI to decode the struct properly
            try {
                const artifactPath = path.join(process.cwd(), 'artifacts', 'contracts', 'EscrowContract.sol', 'EscrowContract.json');
                const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
                const abi = artifact.abi;
                
                // Create ethers Interface from ABI
                const iface = new ethers.Interface(abi);
                
                // Get the function fragment for getDeal
                const functionFragment = iface.getFunction('getDeal');
                if (!functionFragment) {
                    throw new Error('getDeal function not found in ABI');
                }
                
                // Decode the result bytes using ethers.js
                // The result.bytes is a Buffer, convert to hex string
                const resultBytes = '0x' + Buffer.from(result.bytes).toString('hex');
                const decoded = iface.decodeFunctionResult(functionFragment, resultBytes);
                
                // decoded[0] is the Deal struct (tuple)
                // When ethers decodes a struct, it returns it as an array-like object
                // Access fields by index or property name
                const dealStruct = decoded[0];
                
                // Handle both array and object access patterns
                // ethers v6 returns structs as arrays with named properties
                
                // Map status enum (0=PROPOSED, 1=PENDING_FUNDS, 2=PENDING, 3=DISPUTED, 4=SELLER_PAID, 5=BUYER_REFUNDED)
                const statusMap: Record<number, string> = {
                    0: 'PROPOSED',
                    1: 'PENDING_FUNDS',
                    2: 'PENDING',
                    3: 'DISPUTED',
                    4: 'SELLER_PAID',
                    5: 'BUYER_REFUNDED'
                };
                
                // Map asset type enum
                const assetTypeMap: Record<number, string> = {
                    0: 'HBAR',
                    1: 'FUNGIBLE_TOKEN',
                    2: 'NFT'
                };
                
                // Map fee type enum
                const feeTypeMap: Record<number, string> = {
                    0: 'none',
                    1: 'percentage',
                    2: 'flat'
                };
                
                // Return parsed deal data
                // Handle both array index access and property name access (ethers v6 supports both)
                // Check if it's an array or object-like structure
                const getField = (index: number, propName?: string) => {
                    if (propName && dealStruct[propName] !== undefined) {
                        return dealStruct[propName];
                    }
                    return dealStruct[index];
                };
                
                return {
                    dealId: getField(0, 'dealId') || '',
                    buyer: getField(1, 'buyer') || '',
                    seller: getField(2, 'seller') || '',
                    arbiter: getField(3, 'arbiter') || '',
                    amount: (getField(4, 'amount')?.toString()) || '0',
                    status: statusMap[Number(getField(5, 'status'))] || 'UNKNOWN',
                    sellerAccepted: Boolean(getField(6, 'sellerAccepted')) || false,
                    arbiterAccepted: Boolean(getField(7, 'arbiterAccepted')) || false,
                    description: getField(8, 'description') || '',
                    arbiterFeeType: feeTypeMap[Number(getField(9, 'arbiterFeeType'))] || 'none',
                    arbiterFeeAmount: (getField(10, 'arbiterFeeAmount')?.toString()) || '0',
                    assetType: assetTypeMap[Number(getField(11, 'assetType'))] || 'HBAR',
                    assetId: getField(12, 'assetId') || '',
                    assetSerialNumber: (getField(13, 'assetSerialNumber')?.toString()) || '0',
                    createdAt: (getField(14, 'createdAt')?.toString()) || '0',
                    fundsDeposited: Boolean(getField(15, 'fundsDeposited')) || false
                };
            } catch (parseError: any) {
                // If parsing fails, try fallback to basic result access
                console.warn('ABI decoding failed, trying fallback:', parseError.message);
                
                // Fallback: Check if deal exists by checking if result has data
                if (result && result.bytes && result.bytes.length > 0) {
                    return {
                        dealId: dealId,
                        exists: true,
                        note: 'Deal exists but parsing failed. Check contract ABI decoding.',
                        error: parseError.message
                    };
                }
                
                throw new Error(`Failed to query deal: ${parseError.message}`);
            }
        } finally {
            client.close();
        }
    }
};

export default contractUtils;


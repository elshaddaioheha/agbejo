// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Agbejo Escrow Contract
 * @notice Decentralized escrow contract for Hedera Hashgraph
 * @dev Supports HBAR, HTS fungible tokens, and HTS NFTs
 */
contract EscrowContract {
    // ============ Type Definitions ============
    
    enum AssetType {
        HBAR,
        FUNGIBLE_TOKEN,
        NFT
    }
    
    enum FeeType {
        NONE,
        PERCENTAGE,
        FLAT
    }
    
    enum DealStatus {
        PROPOSED,
        PENDING_FUNDS,
        PENDING,
        DISPUTED,
        SELLER_PAID,
        BUYER_REFUNDED
    }
    
    struct DealParams {
        string seller;
        string arbiter;
        uint256 amount;
        string description;
        FeeType arbiterFeeType;
        uint256 arbiterFeeAmount;
        AssetType assetType;
        string assetId;
        uint256 assetSerialNumber;
    }
    
    struct Deal {
        string dealId;
        string buyer; // Hedera account ID (e.g., "0.0.1234")
        string seller;
        string arbiter;
        uint256 amount;
        DealStatus status;
        bool sellerAccepted;
        bool arbiterAccepted;
        string description;
        FeeType arbiterFeeType;
        uint256 arbiterFeeAmount;
        AssetType assetType;
        string assetId; // Token ID (e.g., "0.0.5678" for HBAR, "0.0.12345" for tokens)
        uint256 assetSerialNumber; // For NFTs
        uint256 createdAt;
        bool fundsDeposited;
    }
    
    // ============ State Variables ============
    
    mapping(string => Deal) public deals;
    mapping(string => uint256) public hbarEscrow; // dealId => HBAR amount
    mapping(string => mapping(string => uint256)) public tokenEscrow; // dealId => tokenId => amount
    mapping(string => mapping(string => uint256)) public nftEscrow; // dealId => tokenId => serialNumber
    
    address public owner;
    uint256 public dealCounter;
    
    // ============ Events ============
    
    event DealCreated(
        string indexed dealId,
        string buyer,
        string seller,
        string arbiter,
        uint256 amount,
        AssetType assetType,
        string assetId
    );
    
    event SellerAccepted(string indexed dealId);
    event ArbiterAccepted(string indexed dealId);
    event DealFunded(string indexed dealId, uint256 amount);
    event FundsReleased(string indexed dealId, string seller, uint256 amount);
    event BuyerRefunded(string indexed dealId, string buyer, uint256 amount);
    event DisputeRaised(string indexed dealId);
    event DisputeResolved(string indexed dealId, bool releaseToSeller);
    
    // ============ Modifiers ============
    
    // Removed onlyParticipant modifier - we verify participants via account ID strings instead
    
    modifier onlyArbiter(string memory dealId, string memory arbiterAccountId) {
        require(keccak256(bytes(deals[dealId].arbiter)) == keccak256(bytes(arbiterAccountId)), "Only arbiter can perform this action");
        _;
    }
    
    modifier dealExists(string memory dealId) {
        require(deals[dealId].createdAt > 0, "Deal does not exist");
        _;
    }
    
    // ============ Constructor ============
    
    constructor() {
        owner = msg.sender;
    }
    
    // ============ Receive HBAR ============
    
    receive() external payable {
        // Allow contract to receive HBAR
    }
    
    fallback() external payable {
        // Allow contract to receive HBAR
    }
    
    // ============ Core Functions ============
    
    /**
     * @notice Create a new deal proposal
     * @param dealId Unique deal identifier
     * @param params Deal parameters struct
     */
    function createDeal(
        string memory dealId,
        DealParams memory params
    ) external {
        require(bytes(dealId).length > 0, "Deal ID cannot be empty");
        require(deals[dealId].createdAt == 0, "Deal already exists");
        require(bytes(params.seller).length > 0, "Invalid seller account ID");
        require(bytes(params.arbiter).length > 0, "Invalid arbiter account ID");
        require(params.amount > 0, "Amount must be greater than 0");
        
        // Validate fee configuration
        if (params.arbiterFeeType == FeeType.PERCENTAGE) {
            require(params.arbiterFeeAmount > 0 && params.arbiterFeeAmount <= 100, "Percentage must be between 1 and 100");
        } else if (params.arbiterFeeType == FeeType.FLAT) {
            require(params.arbiterFeeAmount > 0, "Flat fee must be greater than 0");
        }
        
        // Create deal (buyer ID calculated inline to reduce stack depth)
        deals[dealId].dealId = dealId;
        deals[dealId].buyer = _addressToAccountId(msg.sender);
        deals[dealId].seller = params.seller;
        deals[dealId].arbiter = params.arbiter;
        deals[dealId].amount = params.amount;
        deals[dealId].status = DealStatus.PROPOSED;
        deals[dealId].sellerAccepted = false;
        deals[dealId].arbiterAccepted = false;
        deals[dealId].description = params.description;
        deals[dealId].arbiterFeeType = params.arbiterFeeType;
        deals[dealId].arbiterFeeAmount = params.arbiterFeeAmount;
        deals[dealId].assetType = params.assetType;
        deals[dealId].assetId = params.assetId;
        deals[dealId].assetSerialNumber = params.assetSerialNumber;
        deals[dealId].createdAt = block.timestamp;
        deals[dealId].fundsDeposited = false;
        
        dealCounter++;
        
        emit DealCreated(dealId, deals[dealId].buyer, params.seller, params.arbiter, params.amount, params.assetType, params.assetId);
    }
    
    /**
     * @notice Seller accepts the deal
     * @param sellerAccountId Seller's Hedera account ID (for verification)
     */
    function acceptAsSeller(string memory dealId, string memory sellerAccountId) external dealExists(dealId) {
        Deal storage deal = deals[dealId];
        require(keccak256(bytes(deal.seller)) == keccak256(bytes(sellerAccountId)), "Only seller can accept");
        require(deal.status == DealStatus.PROPOSED, "Deal not in PROPOSED status");
        require(!deal.sellerAccepted, "Seller already accepted");
        
        deal.sellerAccepted = true;
        
        // If both accepted, move to PENDING_FUNDS
        if (deal.sellerAccepted && deal.arbiterAccepted) {
            deal.status = DealStatus.PENDING_FUNDS;
        }
        
        emit SellerAccepted(dealId);
    }
    
    /**
     * @notice Arbiter accepts the deal
     * @param arbiterAccountId Arbiter's Hedera account ID (for verification)
     */
    function acceptAsArbiter(string memory dealId, string memory arbiterAccountId) external dealExists(dealId) {
        Deal storage deal = deals[dealId];
        require(keccak256(bytes(deal.arbiter)) == keccak256(bytes(arbiterAccountId)), "Only arbiter can accept");
        require(deal.status == DealStatus.PROPOSED, "Deal not in PROPOSED status");
        require(!deal.arbiterAccepted, "Arbiter already accepted");
        
        deal.arbiterAccepted = true;
        
        // If both accepted, move to PENDING_FUNDS
        if (deal.sellerAccepted && deal.arbiterAccepted) {
            deal.status = DealStatus.PENDING_FUNDS;
        }
        
        emit ArbiterAccepted(dealId);
    }
    
    /**
     * @notice Buyer funds the deal (HBAR)
     * @param buyerAccountId Buyer's Hedera account ID (for verification)
     */
    function fundDealHBAR(string memory dealId, string memory buyerAccountId) external payable dealExists(dealId) {
        Deal storage deal = deals[dealId];
        require(keccak256(bytes(deal.buyer)) == keccak256(bytes(buyerAccountId)), "Only buyer can fund");
        require(deal.status == DealStatus.PENDING_FUNDS, "Deal not ready for funding");
        require(deal.assetType == AssetType.HBAR, "This deal uses tokens, use fundDealToken");
        require(msg.value == deal.amount, "Amount must match deal amount");
        require(!deal.fundsDeposited, "Deal already funded");
        
        hbarEscrow[dealId] = msg.value;
        deal.fundsDeposited = true;
        deal.status = DealStatus.PENDING;
        
        emit DealFunded(dealId, msg.value);
    }
    
    /**
     * @notice Buyer funds the deal (Fungible Token)
     * @param buyerAccountId Buyer's Hedera account ID (for verification)
     * @dev Buyer must approve contract to spend tokens first
     */
    function fundDealToken(string memory dealId, uint256 amount, string memory buyerAccountId) external dealExists(dealId) {
        Deal storage deal = deals[dealId];
        require(keccak256(bytes(deal.buyer)) == keccak256(bytes(buyerAccountId)), "Only buyer can fund");
        require(deal.status == DealStatus.PENDING_FUNDS, "Deal not ready for funding");
        require(deal.assetType == AssetType.FUNGIBLE_TOKEN, "This deal uses HBAR or NFT");
        require(amount == deal.amount, "Amount must match deal amount");
        require(!deal.fundsDeposited, "Deal already funded");
        require(bytes(deal.assetId).length > 0, "Invalid token ID");
        
        // Track tokens in escrow (actual transfer handled by backend via SDK)
        tokenEscrow[dealId][deal.assetId] = amount;
        deal.fundsDeposited = true;
        deal.status = DealStatus.PENDING;
        
        emit DealFunded(dealId, amount);
    }
    
    /**
     * @notice Buyer funds the deal (NFT)
     * @param buyerAccountId Buyer's Hedera account ID (for verification)
     * @dev Buyer must approve contract to transfer NFT first
     */
    function fundDealNFT(string memory dealId, string memory buyerAccountId) external dealExists(dealId) {
        Deal storage deal = deals[dealId];
        require(keccak256(bytes(deal.buyer)) == keccak256(bytes(buyerAccountId)), "Only buyer can fund");
        require(deal.status == DealStatus.PENDING_FUNDS, "Deal not ready for funding");
        require(deal.assetType == AssetType.NFT, "This deal uses HBAR or fungible token");
        require(!deal.fundsDeposited, "Deal already funded");
        require(bytes(deal.assetId).length > 0, "Invalid NFT token ID");
        
        // Track NFT in escrow (actual transfer handled by backend via SDK)
        nftEscrow[dealId][deal.assetId] = deal.assetSerialNumber;
        deal.fundsDeposited = true;
        deal.status = DealStatus.PENDING;
        
        emit DealFunded(dealId, deal.assetSerialNumber);
    }
    
    /**
     * @notice Buyer releases funds to seller
     * @param buyerAccountId Buyer's Hedera account ID (for verification)
     */
    function releaseFunds(string memory dealId, string memory buyerAccountId) external dealExists(dealId) {
        Deal storage deal = deals[dealId];
        require(keccak256(bytes(deal.buyer)) == keccak256(bytes(buyerAccountId)), "Only buyer can release funds");
        require(deal.status == DealStatus.PENDING, "Deal not in PENDING status");
        require(deal.fundsDeposited, "Deal not funded");
        
        uint256 arbiterFee = _calculateArbiterFee(deal);
        uint256 sellerAmount = deal.amount;
        
        // Handle HBAR
        if (deal.assetType == AssetType.HBAR) {
            require(hbarEscrow[dealId] >= deal.amount, "Insufficient HBAR in escrow");
            
            // Note: For Hedera, we can't directly send to account IDs from Solidity
            // The actual transfer will be handled by the backend using Hedera SDK
            // This function marks the deal as ready for release, and the backend executes the transfer
            hbarEscrow[dealId] -= sellerAmount;
            
            // Pay arbiter fee if configured (also handled by backend)
            if (arbiterFee > 0) {
                require(address(this).balance >= arbiterFee, "Insufficient contract balance for fee");
            }
        }
        // Token and NFT transfers handled off-chain via Hedera SDK
        // (Contract tracks state, but Hedera HTS requires SDK for transfers)
        
        deal.status = DealStatus.SELLER_PAID;
        
        emit FundsReleased(dealId, deal.seller, sellerAmount);
    }
    
    /**
     * @notice Buyer raises a dispute
     * @param buyerAccountId Buyer's Hedera account ID (for verification)
     */
    function dispute(string memory dealId, string memory buyerAccountId) external dealExists(dealId) {
        Deal storage deal = deals[dealId];
        require(keccak256(bytes(deal.buyer)) == keccak256(bytes(buyerAccountId)), "Only buyer can raise dispute");
        require(deal.status == DealStatus.PENDING, "Deal not in PENDING status");
        
        deal.status = DealStatus.DISPUTED;
        
        emit DisputeRaised(dealId);
    }
    
    /**
     * @notice Arbiter resolves dispute (release to seller or refund buyer)
     * @param arbiterAccountId Arbiter's Hedera account ID (for verification)
     */
    function resolveDispute(string memory dealId, bool releaseToSeller, string memory arbiterAccountId) external dealExists(dealId) {
        require(keccak256(bytes(deals[dealId].arbiter)) == keccak256(bytes(arbiterAccountId)), "Only arbiter can resolve dispute");
        Deal storage deal = deals[dealId];
        require(deal.status == DealStatus.DISPUTED, "Deal not in DISPUTED status");
        require(deal.fundsDeposited, "Deal not funded");
        
        uint256 arbiterFee = _calculateArbiterFee(deal);
        
        if (releaseToSeller) {
            // Release to seller (actual transfer handled by backend)
            if (deal.assetType == AssetType.HBAR) {
                require(hbarEscrow[dealId] >= deal.amount, "Insufficient HBAR in escrow");
                hbarEscrow[dealId] -= deal.amount;
            }
            deal.status = DealStatus.SELLER_PAID;
            emit FundsReleased(dealId, deal.seller, deal.amount);
        } else {
            // Refund buyer (actual transfer handled by backend)
            if (deal.assetType == AssetType.HBAR) {
                require(hbarEscrow[dealId] >= deal.amount, "Insufficient HBAR in escrow");
                hbarEscrow[dealId] -= deal.amount;
            }
            deal.status = DealStatus.BUYER_REFUNDED;
            emit BuyerRefunded(dealId, deal.buyer, deal.amount);
        }
        
        // Pay arbiter fee if configured (actual transfer handled by backend)
        if (arbiterFee > 0 && deal.assetType == AssetType.HBAR) {
            require(address(this).balance >= arbiterFee, "Insufficient contract balance for fee");
        }
        
        emit DisputeResolved(dealId, releaseToSeller);
    }
    
    /**
     * @notice Refund buyer (no dispute)
     * @param arbiterAccountId Arbiter's Hedera account ID (for verification)
     */
    function refundBuyer(string memory dealId, string memory arbiterAccountId) external dealExists(dealId) {
        require(keccak256(bytes(deals[dealId].arbiter)) == keccak256(bytes(arbiterAccountId)), "Only arbiter can refund");
        Deal storage deal = deals[dealId];
        require(deal.status == DealStatus.PENDING, "Deal not in PENDING status");
        require(deal.fundsDeposited, "Deal not funded");
        
        uint256 arbiterFee = _calculateArbiterFee(deal);
        
        if (deal.assetType == AssetType.HBAR) {
            require(hbarEscrow[dealId] >= deal.amount, "Insufficient HBAR in escrow");
            hbarEscrow[dealId] -= deal.amount;
        }
        
        // Pay arbiter fee if configured (actual transfer handled by backend)
        if (arbiterFee > 0 && deal.assetType == AssetType.HBAR) {
            require(address(this).balance >= arbiterFee, "Insufficient contract balance for fee");
        }
        
        deal.status = DealStatus.BUYER_REFUNDED;
        
        emit BuyerRefunded(dealId, deal.buyer, deal.amount);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get deal details
     */
    function getDeal(string memory dealId) external view returns (Deal memory) {
        return deals[dealId];
    }
    
    /**
     * @notice Get HBAR escrow amount for a deal
     */
    function getHbarEscrow(string memory dealId) external view returns (uint256) {
        return hbarEscrow[dealId];
    }
    
    // ============ Internal Functions ============
    
    /**
     * @notice Calculate arbiter fee based on deal configuration
     */
    function _calculateArbiterFee(Deal memory deal) internal pure returns (uint256) {
        if (deal.arbiterFeeType == FeeType.NONE || deal.arbiterFeeAmount == 0) {
            return 0;
        }
        
        if (deal.arbiterFeeType == FeeType.PERCENTAGE) {
            return (deal.amount * deal.arbiterFeeAmount) / 100;
        } else {
            return deal.arbiterFeeAmount;
        }
    }
    
    /**
     * @notice Convert EVM address to Hedera account ID (simplified - for demo)
     * @dev In production, use Hedera's proper address mapping
     */
    function _addressToAccountId(address addr) internal pure returns (string memory) {
        // Simplified conversion - in production, use Hedera SDK's address mapping
        uint256 accountNum = uint256(uint160(addr));
        return string(abi.encodePacked("0.0.", _uintToString(accountNum)));
    }
    
    /**
     * @notice Convert uint to string
     */
    function _uintToString(uint256 v) internal pure returns (string memory) {
        if (v == 0) {
            return "0";
        }
        uint256 j = v;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (v != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(v - v / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            v /= 10;
        }
        return string(bstr);
    }
}


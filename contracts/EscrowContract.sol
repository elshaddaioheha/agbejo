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
        string arbiter; // Single arbiter (for backward compatibility)
        string[] arbiters; // Array of arbiters for multi-sig
        uint256 requiredVotes; // Required votes (0 = single arbiter, >0 = multi-sig)
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
        string arbiter; // Single arbiter (for backward compatibility)
        string[] arbiters; // Array of arbiters for multi-sig
        uint256 requiredVotes; // Required votes for multi-sig (0 = single arbiter mode)
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
        string evidenceHash; // IPFS/Arweave hash for dispute evidence
    }
    
    // ============ State Variables ============
    
    mapping(string => Deal) public deals;
    mapping(string => uint256) public hbarEscrow; // dealId => HBAR amount
    mapping(string => mapping(string => uint256)) public tokenEscrow; // dealId => tokenId => amount
    mapping(string => mapping(string => uint256)) public nftEscrow; // dealId => tokenId => serialNumber
    
    // Multi-sig arbitration voting
    mapping(string => mapping(string => bool)) public arbiterVoted; // dealId => arbiterAccountId => hasVoted
    mapping(string => mapping(string => bool)) public arbiterVote; // dealId => arbiterAccountId => vote (true = seller, false = buyer)
    mapping(string => uint256) public voteCount; // dealId => current vote count
    mapping(string => uint256) public sellerVotes; // dealId => votes for seller
    mapping(string => uint256) public buyerVotes; // dealId => votes for buyer
    
    // Reputation system
    mapping(string => uint256) public sellerSuccessfulDeals; // sellerAccountId => count
    mapping(string => uint256) public arbiterDisputesResolved; // arbiterAccountId => count
    
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
    event DisputeRaised(string indexed dealId, string evidenceHash);
    event DisputeResolved(string indexed dealId, bool releaseToSeller);
    event ArbiterVoted(string indexed dealId, string arbiterAccountId, bool voteForSeller);
    event EvidenceSubmitted(string indexed dealId, string evidenceHash);
    
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
        require(params.amount > 0, "Amount must be greater than 0");
        
        // Validate arbitration setup: either single arbiter or multi-sig
        bool isMultiSig = params.arbiters.length > 0 && params.requiredVotes > 0;
        bool isSingleArbiter = bytes(params.arbiter).length > 0;
        require(isMultiSig || isSingleArbiter, "Must specify either single arbiter or multi-sig arbiters");
        
        if (isMultiSig) {
            require(params.arbiters.length >= params.requiredVotes, "Required votes cannot exceed number of arbiters");
            require(params.requiredVotes > 0, "Required votes must be greater than 0");
        }
        
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
        deals[dealId].arbiter = params.arbiter; // For backward compatibility
        deals[dealId].arbiters = params.arbiters; // Multi-sig arbiters
        deals[dealId].requiredVotes = params.requiredVotes;
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
        deals[dealId].evidenceHash = "";
        
        dealCounter++;
        
        string memory arbiterDisplay = isMultiSig ? params.arbiters[0] : params.arbiter;
        emit DealCreated(dealId, deals[dealId].buyer, params.seller, arbiterDisplay, params.amount, params.assetType, params.assetId);
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
        require(deal.status == DealStatus.PROPOSED, "Deal not in PROPOSED status");
        
        bool isAuthorized = false;
        
        // Check if single arbiter mode
        if (bytes(deal.arbiter).length > 0 && keccak256(bytes(deal.arbiter)) == keccak256(bytes(arbiterAccountId))) {
            require(!deal.arbiterAccepted, "Arbiter already accepted");
            deal.arbiterAccepted = true;
            isAuthorized = true;
        }
        // Check if multi-sig mode
        else if (deal.arbiters.length > 0) {
            bool isArbiter = false;
            for (uint256 i = 0; i < deal.arbiters.length; i++) {
                if (keccak256(bytes(deal.arbiters[i])) == keccak256(bytes(arbiterAccountId))) {
                    isArbiter = true;
                    break;
                }
            }
            require(isArbiter, "Only authorized arbiters can accept");
            // In multi-sig, we consider accepted when seller accepts (arbiters vote during dispute)
            // For now, mark as accepted if this is the first arbiter checking in
            if (!deal.arbiterAccepted) {
                deal.arbiterAccepted = true;
            }
            isAuthorized = true;
        }
        
        require(isAuthorized, "Only arbiter can accept");
        
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
        
        // Update reputation: increment seller successful deals
        sellerSuccessfulDeals[deal.seller]++;
        
        emit FundsReleased(dealId, deal.seller, sellerAmount);
    }
    
    /**
     * @notice Buyer raises a dispute
     * @param buyerAccountId Buyer's Hedera account ID (for verification)
     * @param evidenceHash IPFS/Arweave hash of evidence (can be empty)
     */
    function dispute(string memory dealId, string memory buyerAccountId, string memory evidenceHash) external dealExists(dealId) {
        Deal storage deal = deals[dealId];
        require(keccak256(bytes(deal.buyer)) == keccak256(bytes(buyerAccountId)), "Only buyer can raise dispute");
        require(deal.status == DealStatus.PENDING, "Deal not in PENDING status");
        
        deal.status = DealStatus.DISPUTED;
        deal.evidenceHash = evidenceHash;
        
        // Reset voting state for multi-sig
        if (deal.arbiters.length > 0) {
            voteCount[dealId] = 0;
            sellerVotes[dealId] = 0;
            buyerVotes[dealId] = 0;
        }
        
        emit DisputeRaised(dealId, evidenceHash);
    }
    
    /**
     * @notice Arbiter votes on dispute resolution (for multi-sig) or resolves directly (single arbiter)
     * @param arbiterAccountId Arbiter's Hedera account ID (for verification)
     * @param releaseToSeller true = vote for seller, false = vote for buyer refund
     */
    function voteOnDispute(string memory dealId, bool releaseToSeller, string memory arbiterAccountId) external dealExists(dealId) {
        Deal storage deal = deals[dealId];
        require(deal.status == DealStatus.DISPUTED, "Deal not in DISPUTED status");
        require(deal.fundsDeposited, "Deal not funded");
        
        bool isAuthorized = false;
        bool isMultiSig = deal.arbiters.length > 0 && deal.requiredVotes > 0;
        
        // Check authorization
        if (!isMultiSig && bytes(deal.arbiter).length > 0) {
            // Single arbiter mode - resolve directly
            require(keccak256(bytes(deal.arbiter)) == keccak256(bytes(arbiterAccountId)), "Only arbiter can resolve dispute");
            isAuthorized = true;
            
            // Resolve immediately for single arbiter
            uint256 arbiterFee = _calculateArbiterFee(deal);
            
            if (releaseToSeller) {
                if (deal.assetType == AssetType.HBAR) {
                    require(hbarEscrow[dealId] >= deal.amount, "Insufficient HBAR in escrow");
                    hbarEscrow[dealId] -= deal.amount;
                }
                deal.status = DealStatus.SELLER_PAID;
                sellerSuccessfulDeals[deal.seller]++;
                emit FundsReleased(dealId, deal.seller, deal.amount);
            } else {
                if (deal.assetType == AssetType.HBAR) {
                    require(hbarEscrow[dealId] >= deal.amount, "Insufficient HBAR in escrow");
                    hbarEscrow[dealId] -= deal.amount;
                }
                deal.status = DealStatus.BUYER_REFUNDED;
                emit BuyerRefunded(dealId, deal.buyer, deal.amount);
            }
            
            // Update arbiter reputation
            arbiterDisputesResolved[arbiterAccountId]++;
            
            emit DisputeResolved(dealId, releaseToSeller);
        } else if (isMultiSig) {
            // Multi-sig mode - collect votes
            bool isArbiter = false;
            for (uint256 i = 0; i < deal.arbiters.length; i++) {
                if (keccak256(bytes(deal.arbiters[i])) == keccak256(bytes(arbiterAccountId))) {
                    isArbiter = true;
                    break;
                }
            }
            require(isArbiter, "Only authorized arbiters can vote");
            require(!arbiterVoted[dealId][arbiterAccountId], "Arbiter already voted");
            
            isAuthorized = true;
            
            // Record vote
            arbiterVoted[dealId][arbiterAccountId] = true;
            arbiterVote[dealId][arbiterAccountId] = releaseToSeller;
            voteCount[dealId]++;
            
            if (releaseToSeller) {
                sellerVotes[dealId]++;
            } else {
                buyerVotes[dealId]++;
            }
            
            emit ArbiterVoted(dealId, arbiterAccountId, releaseToSeller);
            
            // Check if we have enough votes to resolve
            if (voteCount[dealId] >= deal.requiredVotes) {
                bool finalDecision = sellerVotes[dealId] > buyerVotes[dealId];
                _executeDisputeResolution(dealId, finalDecision);
            }
        }
        
        require(isAuthorized, "Not authorized to vote");
    }
    
    /**
     * @notice Internal function to execute dispute resolution after votes are collected
     */
    function _executeDisputeResolution(string memory dealId, bool releaseToSeller) internal {
        Deal storage deal = deals[dealId];
        uint256 arbiterFee = _calculateArbiterFee(deal);
        
        if (releaseToSeller) {
            if (deal.assetType == AssetType.HBAR) {
                require(hbarEscrow[dealId] >= deal.amount, "Insufficient HBAR in escrow");
                hbarEscrow[dealId] -= deal.amount;
            }
            deal.status = DealStatus.SELLER_PAID;
            sellerSuccessfulDeals[deal.seller]++;
            emit FundsReleased(dealId, deal.seller, deal.amount);
        } else {
            if (deal.assetType == AssetType.HBAR) {
                require(hbarEscrow[dealId] >= deal.amount, "Insufficient HBAR in escrow");
                hbarEscrow[dealId] -= deal.amount;
            }
            deal.status = DealStatus.BUYER_REFUNDED;
            emit BuyerRefunded(dealId, deal.buyer, deal.amount);
        }
        
        // Update reputation for all arbiters who voted
        for (uint256 i = 0; i < deal.arbiters.length; i++) {
            if (arbiterVoted[dealId][deal.arbiters[i]]) {
                arbiterDisputesResolved[deal.arbiters[i]]++;
            }
        }
        
        emit DisputeResolved(dealId, releaseToSeller);
    }
    
    /**
     * @notice Legacy function for single arbiter dispute resolution (backward compatibility)
     * @param arbiterAccountId Arbiter's Hedera account ID (for verification)
     */
    function resolveDispute(string memory dealId, bool releaseToSeller, string memory arbiterAccountId) external {
        this.voteOnDispute(dealId, releaseToSeller, arbiterAccountId);
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
     * @notice Get voting status for a deal
     */
    function getVotingStatus(string memory dealId) external view returns (
        uint256 currentVotes,
        uint256 requiredVotes,
        uint256 sellerVoteCount,
        uint256 buyerVoteCount
    ) {
        return (
            voteCount[dealId],
            deals[dealId].requiredVotes,
            sellerVotes[dealId],
            buyerVotes[dealId]
        );
    }
    
    /**
     * @notice Check if an arbiter has voted
     */
    function hasArbiterVoted(string memory dealId, string memory arbiterAccountId) external view returns (bool) {
        return arbiterVoted[dealId][arbiterAccountId];
    }
    
    /**
     * @notice Get arbiter's vote
     */
    function getArbiterVote(string memory dealId, string memory arbiterAccountId) external view returns (bool) {
        return arbiterVote[dealId][arbiterAccountId];
    }
    
    /**
     * @notice Submit evidence hash (can be called by buyer or seller)
     */
    function submitEvidence(string memory dealId, string memory evidenceHash) external dealExists(dealId) {
        Deal storage deal = deals[dealId];
        require(
            keccak256(bytes(deal.buyer)) == keccak256(bytes(_addressToAccountId(msg.sender))) ||
            keccak256(bytes(deal.seller)) == keccak256(bytes(_addressToAccountId(msg.sender))),
            "Only buyer or seller can submit evidence"
        );
        require(deal.status == DealStatus.DISPUTED, "Deal must be in DISPUTED status");
        
        deal.evidenceHash = evidenceHash;
        emit EvidenceSubmitted(dealId, evidenceHash);
    }
    
    /**
     * @notice Get reputation stats
     */
    function getSellerReputation(string memory sellerAccountId) external view returns (uint256) {
        return sellerSuccessfulDeals[sellerAccountId];
    }
    
    function getArbiterReputation(string memory arbiterAccountId) external view returns (uint256) {
        return arbiterDisputesResolved[arbiterAccountId];
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


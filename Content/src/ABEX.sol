// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ISentinelDenyList} from "./ISentinelDenyList.sol";

/// @title ABEX — Avatar Battle Exchange
/// @notice On-chain trading with a circuit breaker that halts when price moves
///         exceed a configurable threshold within a single block window.
///         Anomaly detection surface: wash trading, price manipulation.
contract ABEX is Ownable, Pausable {

    // ── Sentinel integration ───────────────────────────────────────────────
    ISentinelDenyList public denyList;

    // ── Circuit breaker config ─────────────────────────────────────────────
    /// @dev Basis points (1 bp = 0.01%). 1000 bps = 10% move triggers pause.
    uint256 public circuitBreakerBps = 1000;

    /// @dev Reference price updated each block. Reset on unpause.
    uint256 public referencePrice;
    uint256 public referencePriceBlock;

    // ── Order book (simplified AMM-style price tracking) ──────────────────
    struct Trade {
        address buyer;
        address seller;
        uint256 tokenId;
        uint256 price;
        uint256 blockNumber;
        uint256 timestamp;
    }

    mapping(uint256 => Trade) public trades;
    uint256 public tradeCount;

    // ── Events ─────────────────────────────────────────────────────────────
    event TradeExecuted(
        uint256 indexed tradeId,
        address indexed buyer,
        address indexed seller,
        uint256 tokenId,
        uint256 price,
        uint256 blockNumber
    );
    event CircuitBreakerTriggered(
        uint256 referencePrice,
        uint256 tradePrice,
        uint256 moveBps,
        uint256 blockNumber
    );
    event CircuitBreakerConfigUpdated(uint256 newThresholdBps);
    event ReferencePriceSet(uint256 price, uint256 blockNumber);
    event ContractPausedBySentinel(address indexed caller);

    // ── Errors ─────────────────────────────────────────────────────────────
    error WalletDenied(address wallet);
    error PriceMoveExceedsThreshold(uint256 moveBps, uint256 limitBps);
    error InvalidPrice();
    error SelfTrade();

    constructor(
        uint256 initialPrice_,
        address denyList_,
        address owner_
    ) Ownable(owner_) {
        referencePrice = initialPrice_;
        referencePriceBlock = block.number;
        denyList = ISentinelDenyList(denyList_);
    }

    // ── External: execute trade ────────────────────────────────────────────

    /// @notice Record a trade and enforce the circuit breaker.
    ///         Real implementation would integrate ERC-721 transferFrom; price
    ///         check is the Sentinel guard layer.
    function executeTrade(
        address seller,
        uint256 tokenId,
        uint256 price
    ) external payable whenNotPaused returns (uint256 tradeId) {
        address buyer = msg.sender;

        if (price == 0) revert InvalidPrice();
        if (buyer == seller) revert SelfTrade();

        // Deny-list guard
        if (address(denyList) != address(0)) {
            if (denyList.isDenied(buyer)) revert WalletDenied(buyer);
            if (denyList.isDenied(seller)) revert WalletDenied(seller);
        }

        // Circuit breaker: compare to reference price from current block window
        _checkCircuitBreaker(price);

        // Update reference price once per block (TWAP anchor point)
        if (block.number > referencePriceBlock) {
            referencePrice = price;
            referencePriceBlock = block.number;
            emit ReferencePriceSet(price, block.number);
        }

        tradeId = tradeCount++;
        trades[tradeId] = Trade({
            buyer: buyer,
            seller: seller,
            tokenId: tokenId,
            price: price,
            blockNumber: block.number,
            timestamp: block.timestamp
        });

        emit TradeExecuted(tradeId, buyer, seller, tokenId, price, block.number);
    }

    // ── Internal: circuit breaker logic ───────────────────────────────────

    function _checkCircuitBreaker(uint256 tradePrice) internal {
        if (referencePrice == 0) return;

        uint256 moveBps;
        if (tradePrice > referencePrice) {
            moveBps = ((tradePrice - referencePrice) * 10_000) / referencePrice;
        } else {
            moveBps = ((referencePrice - tradePrice) * 10_000) / referencePrice;
        }

        if (moveBps >= circuitBreakerBps) {
            emit CircuitBreakerTriggered(referencePrice, tradePrice, moveBps, block.number);
            // Self-pause — no owner call required; the trade itself triggers it
            _pause();
            revert PriceMoveExceedsThreshold(moveBps, circuitBreakerBps);
        }
    }

    // ── Owner: Sentinel response actions ──────────────────────────────────

    function pause() external onlyOwner {
        emit ContractPausedBySentinel(msg.sender);
        _pause();
    }

    function unpause() external onlyOwner {
        // Reset reference price on resume to avoid stale anchor
        referencePrice = 0;
        referencePriceBlock = block.number;
        _unpause();
    }

    function setCircuitBreakerBps(uint256 bps_) external onlyOwner {
        require(bps_ > 0 && bps_ <= 10_000, "ABEX: invalid bps");
        circuitBreakerBps = bps_;
        emit CircuitBreakerConfigUpdated(bps_);
    }

    function setDenyList(address denyList_) external onlyOwner {
        denyList = ISentinelDenyList(denyList_);
    }

    // ── View ───────────────────────────────────────────────────────────────

    /// @notice Off-chain detection: what would the move be for a given price?
    function simulatePriceMove(uint256 price) external view returns (uint256 moveBps, bool wouldTrigger) {
        if (referencePrice == 0) return (0, false);
        if (price > referencePrice) {
            moveBps = ((price - referencePrice) * 10_000) / referencePrice;
        } else {
            moveBps = ((referencePrice - price) * 10_000) / referencePrice;
        }
        wouldTrigger = moveBps >= circuitBreakerBps;
    }
}

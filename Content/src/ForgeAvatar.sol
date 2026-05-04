// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ISentinelDenyList} from "./ISentinelDenyList.sol";

/// @title ForgeAvatar
/// @notice ERC-721 NFT mint with per-wallet, per-block rate limiting and Sentinel deny-list guard.
///         Anomaly detection surface: bot / sybil mint detection.
contract ForgeAvatar is ERC721, Ownable, Pausable {

    // ── Sentinel integration ───────────────────────────────────────────────
    ISentinelDenyList public denyList;

    // ── Rate limiter state ─────────────────────────────────────────────────
    /// @dev Max mints a single wallet may execute within one block.
    uint256 public maxMintsPerBlock = 3;

    /// @dev wallet => block number => mint count that block
    mapping(address => mapping(uint256 => uint256)) private _blockMints;

    // ── Token supply ───────────────────────────────────────────────────────
    uint256 private _nextTokenId;
    uint256 public maxSupply;

    // ── Events (indexed for subgraph) ──────────────────────────────────────
    event AvatarMinted(address indexed minter, uint256 indexed tokenId, uint256 blockNumber);
    event MintRateLimitHit(address indexed minter, uint256 blockNumber, uint256 attemptCount);
    event DenyListUpdated(address indexed newDenyList);
    event MaxMintsPerBlockUpdated(uint256 newMax);
    event ContractPausedBySentinel(address indexed caller);

    // ── Errors ─────────────────────────────────────────────────────────────
    error RateLimitExceeded(address minter, uint256 blockNumber, uint256 limit);
    error WalletDenied(address wallet);
    error MaxSupplyReached();

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 maxSupply_,
        address denyList_,
        address owner_
    ) ERC721(name_, symbol_) Ownable(owner_) {
        maxSupply = maxSupply_;
        denyList = ISentinelDenyList(denyList_);
    }

    // ── External: mint ─────────────────────────────────────────────────────

    /// @notice Mint one avatar per call. Rate-limited per block per wallet.
    function mint() external whenNotPaused {
        address minter = msg.sender;

        // 1. Deny-list guard — checked before any state change
        if (address(denyList) != address(0) && denyList.isDenied(minter)) {
            revert WalletDenied(minter);
        }

        // 2. Supply cap
        uint256 tokenId = _nextTokenId;
        if (tokenId >= maxSupply) revert MaxSupplyReached();

        // 3. Per-block rate limit
        uint256 blockNum = block.number;
        uint256 mintCount = _blockMints[minter][blockNum] + 1;

        if (mintCount > maxMintsPerBlock) {
            emit MintRateLimitHit(minter, blockNum, mintCount);
            revert RateLimitExceeded(minter, blockNum, maxMintsPerBlock);
        }

        _blockMints[minter][blockNum] = mintCount;
        _nextTokenId++;

        _safeMint(minter, tokenId);

        // Emit rich event for subgraph indexer
        emit AvatarMinted(minter, tokenId, blockNum);
    }

    // ── Owner: Sentinel response actions ──────────────────────────────────

    /// @notice Sentinel auto-pause: triggered by off-chain HIGH risk score.
    function pause() external onlyOwner {
        emit ContractPausedBySentinel(msg.sender);
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Update the deny-list contract address (e.g. after deployment of v2).
    function setDenyList(address denyList_) external onlyOwner {
        denyList = ISentinelDenyList(denyList_);
        emit DenyListUpdated(denyList_);
    }

    /// @notice Tune rate limit without redeployment. Start permissive; tighten on real data.
    function setMaxMintsPerBlock(uint256 max_) external onlyOwner {
        maxMintsPerBlock = max_;
        emit MaxMintsPerBlockUpdated(max_);
    }

    // ── View ───────────────────────────────────────────────────────────────

    /// @notice Returns remaining mint capacity in the current block for a given wallet.
    ///         Useful for off-chain bot detection baseline.
    function remainingMintsThisBlock(address wallet) external view returns (uint256) {
        uint256 used = _blockMints[wallet][block.number];
        return used >= maxMintsPerBlock ? 0 : maxMintsPerBlock - used;
    }

    function totalSupply() external view returns (uint256) {
        return _nextTokenId;
    }
}

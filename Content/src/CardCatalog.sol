// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ISentinelDenyList} from "./ISentinelDenyList.sol";

/// @title CardCatalog
/// @notice On-chain card registry with OpenZeppelin AccessControl role gating.
///         Anomaly detection surface: privilege escalation, unauthorized role grants.
contract CardCatalog is AccessControl, Pausable {

    // ── Role definitions ───────────────────────────────────────────────────
    bytes32 public constant CATALOGER_ROLE = keccak256("CATALOGER_ROLE");
    bytes32 public constant CURATOR_ROLE   = keccak256("CURATOR_ROLE");
    bytes32 public constant SENTINEL_ROLE  = keccak256("SENTINEL_ROLE");

    // ── Sentinel integration ───────────────────────────────────────────────
    ISentinelDenyList public denyList;

    // ── Card registry ──────────────────────────────────────────────────────
    struct Card {
        uint256 id;
        string  metadataURI;
        address registeredBy;
        uint256 registeredAt;
        bool    active;
    }

    mapping(uint256 => Card) public cards;
    uint256 public cardCount;

    // ── Events ─────────────────────────────────────────────────────────────
    event CardRegistered(uint256 indexed cardId, address indexed registeredBy, string metadataURI);
    event CardDeactivated(uint256 indexed cardId, address indexed deactivatedBy);
    event CardUpdated(uint256 indexed cardId, string newMetadataURI);
    event RoleGrantedAudit(bytes32 indexed role, address indexed account, address indexed grantor);
    event RoleRevokedAudit(bytes32 indexed role, address indexed account, address indexed revoker);
    event ContractPausedBySentinel(address indexed caller);

    // ── Errors ─────────────────────────────────────────────────────────────
    error WalletDenied(address wallet);
    error CardNotFound(uint256 cardId);
    error CardInactive(uint256 cardId);

    constructor(address admin_, address denyList_) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        _grantRole(SENTINEL_ROLE, admin_);
        denyList = ISentinelDenyList(denyList_);
    }

    // ── External: catalog actions ──────────────────────────────────────────

    /// @notice Register a new card. Requires CATALOGER_ROLE.
    function registerCard(string calldata metadataURI)
        external
        whenNotPaused
        onlyRole(CATALOGER_ROLE)
        returns (uint256 cardId)
    {
        _guardDenyList(msg.sender);

        cardId = cardCount++;
        cards[cardId] = Card({
            id: cardId,
            metadataURI: metadataURI,
            registeredBy: msg.sender,
            registeredAt: block.timestamp,
            active: true
        });

        emit CardRegistered(cardId, msg.sender, metadataURI);
    }

    /// @notice Update card metadata. Requires CURATOR_ROLE.
    function updateCard(uint256 cardId, string calldata metadataURI)
        external
        whenNotPaused
        onlyRole(CURATOR_ROLE)
    {
        _guardDenyList(msg.sender);
        if (cards[cardId].registeredAt == 0) revert CardNotFound(cardId);
        if (!cards[cardId].active) revert CardInactive(cardId);

        cards[cardId].metadataURI = metadataURI;
        emit CardUpdated(cardId, metadataURI);
    }

    /// @notice Deactivate a card. Requires CURATOR_ROLE or DEFAULT_ADMIN_ROLE.
    function deactivateCard(uint256 cardId) external {
        require(
            hasRole(CURATOR_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "CardCatalog: insufficient role"
        );
        if (cards[cardId].registeredAt == 0) revert CardNotFound(cardId);

        cards[cardId].active = false;
        emit CardDeactivated(cardId, msg.sender);
    }

    // ── Owner / Sentinel: pause ───────────────────────────────────────────

    /// @notice Sentinel ROLE can pause without going through DEFAULT_ADMIN.
    ///         Allows automated response without exposing the admin key.
    function pause() external {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender) || hasRole(SENTINEL_ROLE, msg.sender),
            "CardCatalog: not authorized to pause"
        );
        emit ContractPausedBySentinel(msg.sender);
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function setDenyList(address denyList_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        denyList = ISentinelDenyList(denyList_);
    }

    // ── Audited role management ────────────────────────────────────────────
    // Wrap OZ grantRole/revokeRole to emit extra audit events for the subgraph.

    function grantRoleAudited(bytes32 role, address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(role, account);
        emit RoleGrantedAudit(role, account, msg.sender);
    }

    function revokeRoleAudited(bytes32 role, address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(role, account);
        emit RoleRevokedAudit(role, account, msg.sender);
    }

    // ── Internal ───────────────────────────────────────────────────────────

    function _guardDenyList(address wallet) internal view {
        if (address(denyList) != address(0) && denyList.isDenied(wallet)) {
            revert WalletDenied(wallet);
        }
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ISentinelDenyList} from "./ISentinelDenyList.sol";

/// @title SentinelDenyList
/// @notice Central on-chain deny mapping. Checked by all four Sentinel contracts
///         before executing sensitive actions. SENTINEL_OPERATOR_ROLE is the
///         automated response layer — no admin key exposure required.
contract SentinelDenyList is ISentinelDenyList, AccessControl {

    bytes32 public constant SENTINEL_OPERATOR_ROLE = keccak256("SENTINEL_OPERATOR_ROLE");

    mapping(address => bool) private _denied;
    mapping(address => string) public denyReason;
    mapping(address => uint256) public deniedAt;

    event WalletDenied(address indexed wallet, string reason, address indexed operator);
    event WalletCleared(address indexed wallet, address indexed operator);

    error AlreadyDenied(address wallet);
    error NotDenied(address wallet);

    constructor(address admin_) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        _grantRole(SENTINEL_OPERATOR_ROLE, admin_);
    }

    // ── ISentinelDenyList ─────────────────────────────────────────────────

    function isDenied(address wallet) external view override returns (bool) {
        return _denied[wallet];
    }

    // ── Operator: add / remove ─────────────────────────────────────────────

    /// @notice Add a wallet to the deny list with a reason string.
    ///         Called by the off-chain response layer (webhook → tx).
    function denyWallet(address wallet, string calldata reason)
        external
        onlyRole(SENTINEL_OPERATOR_ROLE)
    {
        if (_denied[wallet]) revert AlreadyDenied(wallet);
        _denied[wallet] = true;
        denyReason[wallet] = reason;
        deniedAt[wallet] = block.timestamp;
        emit WalletDenied(wallet, reason, msg.sender);
    }

    /// @notice Bulk deny — gas efficient for batch response to a bot wave.
    function denyWalletBatch(address[] calldata wallets, string calldata reason)
        external
        onlyRole(SENTINEL_OPERATOR_ROLE)
    {
        for (uint256 i = 0; i < wallets.length; i++) {
            if (!_denied[wallets[i]]) {
                _denied[wallets[i]] = true;
                denyReason[wallets[i]] = reason;
                deniedAt[wallets[i]] = block.timestamp;
                emit WalletDenied(wallets[i], reason, msg.sender);
            }
        }
    }

    /// @notice Clear a wallet after manual review.
    function clearWallet(address wallet)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        if (!_denied[wallet]) revert NotDenied(wallet);
        _denied[wallet] = false;
        delete denyReason[wallet];
        delete deniedAt[wallet];
        emit WalletCleared(wallet, msg.sender);
    }
}

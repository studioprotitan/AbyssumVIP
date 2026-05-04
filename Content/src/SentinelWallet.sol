// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ISentinelDenyList} from "./ISentinelDenyList.sol";

/// @title SentinelWallet
/// @notice Smart wallet with EIP-712 typed signature verification on every
///         sensitive action. Nonce-based replay protection.
///         Anomaly detection surface: stolen signatures, replay attacks, key compromise.
contract SentinelWallet is Ownable, Pausable, EIP712 {
    using ECDSA for bytes32;

    // ── Sentinel integration ───────────────────────────────────────────────
    ISentinelDenyList public denyList;

    // ── EIP-712 type hashes ────────────────────────────────────────────────
    bytes32 public constant TRANSFER_TYPEHASH = keccak256(
        "Transfer(address from,address to,uint256 tokenId,uint256 nonce,uint256 deadline)"
    );
    bytes32 public constant APPROVE_TYPEHASH = keccak256(
        "Approve(address owner,address spender,uint256 tokenId,uint256 nonce,uint256 deadline)"
    );

    // ── Replay protection ──────────────────────────────────────────────────
    /// @dev Per-wallet nonce. Incremented on every successful sensitive action.
    mapping(address => uint256) public nonces;

    /// @dev Used signatures: hash => consumed. Belt-and-suspenders on top of nonces.
    mapping(bytes32 => bool) private _usedSignatures;

    // ── Events ─────────────────────────────────────────────────────────────
    event TransferAuthorized(
        address indexed from,
        address indexed to,
        uint256 tokenId,
        uint256 nonce,
        bytes32 structHash
    );
    event ApprovalAuthorized(
        address indexed owner,
        address indexed spender,
        uint256 tokenId,
        uint256 nonce
    );
    event SignatureReplayAttempt(address indexed signer, bytes32 structHash);
    event InvalidSignatureAttempt(address indexed caller, bytes32 structHash, address recovered);
    event ContractPausedBySentinel(address indexed caller);

    // ── Errors ─────────────────────────────────────────────────────────────
    error WalletDenied(address wallet);
    error SignatureExpired(uint256 deadline, uint256 blockTimestamp);
    error SignatureAlreadyUsed(bytes32 structHash);
    error InvalidSignature(address expected, address recovered);
    error NonceMismatch(uint256 expected, uint256 provided);

    constructor(
        address owner_,
        address denyList_
    ) Ownable(owner_) EIP712("SentinelWallet", "1") {
        denyList = ISentinelDenyList(denyList_);
    }

    // ── External: verified transfer ────────────────────────────────────────

    /// @notice Execute a transfer authorized via EIP-712 typed signature.
    ///         The `from` wallet must have signed the Transfer struct.
    function authorizeTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) external whenNotPaused returns (bool) {
        // Deny-list
        if (address(denyList) != address(0)) {
            if (denyList.isDenied(from)) revert WalletDenied(from);
            if (denyList.isDenied(to))   revert WalletDenied(to);
        }

        // Deadline
        if (block.timestamp > deadline) revert SignatureExpired(deadline, block.timestamp);

        // Nonce match
        if (nonces[from] != nonce) revert NonceMismatch(nonces[from], nonce);

        // Build struct hash
        bytes32 structHash = keccak256(abi.encode(
            TRANSFER_TYPEHASH, from, to, tokenId, nonce, deadline
        ));

        // Replay guard on the full digest
        bytes32 digest = _hashTypedDataV4(structHash);
        if (_usedSignatures[digest]) {
            emit SignatureReplayAttempt(from, structHash);
            revert SignatureAlreadyUsed(structHash);
        }

        // Recover and verify
        address recovered = digest.recover(signature);
        if (recovered != from) {
            emit InvalidSignatureAttempt(msg.sender, structHash, recovered);
            revert InvalidSignature(from, recovered);
        }

        // Consume: increment nonce, mark signature used
        nonces[from]++;
        _usedSignatures[digest] = true;

        emit TransferAuthorized(from, to, tokenId, nonce, structHash);

        // Downstream: caller integrates with ERC-721 transferFrom
        return true;
    }

    /// @notice Verify an approval via EIP-712 typed signature.
    function authorizeApproval(
        address owner_,
        address spender,
        uint256 tokenId,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) external whenNotPaused returns (bool) {
        if (address(denyList) != address(0) && denyList.isDenied(owner_)) {
            revert WalletDenied(owner_);
        }

        if (block.timestamp > deadline) revert SignatureExpired(deadline, block.timestamp);
        if (nonces[owner_] != nonce) revert NonceMismatch(nonces[owner_], nonce);

        bytes32 structHash = keccak256(abi.encode(
            APPROVE_TYPEHASH, owner_, spender, tokenId, nonce, deadline
        ));

        bytes32 digest = _hashTypedDataV4(structHash);
        if (_usedSignatures[digest]) revert SignatureAlreadyUsed(structHash);

        address recovered = digest.recover(signature);
        if (recovered != owner_) {
            emit InvalidSignatureAttempt(msg.sender, structHash, recovered);
            revert InvalidSignature(owner_, recovered);
        }

        nonces[owner_]++;
        _usedSignatures[digest] = true;

        emit ApprovalAuthorized(owner_, spender, tokenId, nonce);
        return true;
    }

    // ── View: EIP-712 helpers ─────────────────────────────────────────────

    /// @notice Build the digest off-chain signers should sign for a Transfer.
    function transferDigest(
        address from,
        address to,
        uint256 tokenId,
        uint256 nonce,
        uint256 deadline
    ) external view returns (bytes32) {
        return _hashTypedDataV4(keccak256(abi.encode(
            TRANSFER_TYPEHASH, from, to, tokenId, nonce, deadline
        )));
    }

    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    // ── Owner: Sentinel response ──────────────────────────────────────────

    function pause() external onlyOwner {
        emit ContractPausedBySentinel(msg.sender);
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function setDenyList(address denyList_) external onlyOwner {
        denyList = ISentinelDenyList(denyList_);
    }
}

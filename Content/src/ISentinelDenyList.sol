// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ISentinelDenyList
/// @notice Shared interface for the on-chain deny mapping checked by all four contracts.
interface ISentinelDenyList {
    function isDenied(address wallet) external view returns (bool);
}

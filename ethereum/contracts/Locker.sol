// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Locker {
    event VaultCreated(
        address tokenContract,
        ReleaseCheckpoint[] releaseCheckpoints,
        uint256 index
    );
    event VaultClaimed(uint256 index);

    struct ReleaseCheckpoint {
        uint256 id;
        uint256 tokensCount;
        uint256 releaseTargetTimestamp;
        bool claimed;
    }

    struct VestedTokenVault {
        address tokenAddress;
        //ETH for ethereum, BNB for BSC, AVAX for AVA c-chain
        bool nativeToken;
        ReleaseCheckpoint[] checkpoints;
    }

    struct UserLocks {
        VestedTokenVault[] userVaults;
    }

    //every user has multiple vaults: he can store any token with different release schedules.
    //Token might be duplicated, e.g.
    //Vault1: USDC with 6 months lock + Vault2: USDC with 12 months lock + Vault3: DAI with custom schedule
    mapping(address => UserLocks) userLocks;

    function lockERC20(
        address tokenContract,
        ReleaseCheckpoint[] memory releaseCheckpoints
    ) public returns (uint256) {
        require(tokenContract != address(0), "Token contract is null");
        //push new element to user's vault and get it's index
        userLocks[msg.sender].userVaults.push();
        uint256 vaultIndex = userLocks[msg.sender].userVaults.length - 1;

        //get created user Vault by index
        VestedTokenVault storage targetVault = userLocks[msg.sender].userVaults[
            vaultIndex
        ];
        //fill input data
        targetVault.tokenAddress = tokenContract;
        targetVault.nativeToken = false;

        uint256 totalTransfer = 0;
        for (uint256 i; i < releaseCheckpoints.length; i++) {
            require(
                releaseCheckpoints[i].releaseTargetTimestamp > block.timestamp,
                "Date in the past selected"
            );
            require(
                releaseCheckpoints[i].tokensCount > 0,
                "Token count must be positive number"
            );

            targetVault.checkpoints.push(
                ReleaseCheckpoint({
                    id: i,
                    tokensCount: releaseCheckpoints[i].tokensCount,
                    releaseTargetTimestamp: releaseCheckpoints[i]
                        .releaseTargetTimestamp,
                    claimed: false
                })
            );
            totalTransfer += releaseCheckpoints[i].tokensCount;
        }

        IERC20(tokenContract).transferFrom(
            msg.sender,
            address(this),
            totalTransfer
        );
        emit VaultCreated(tokenContract, releaseCheckpoints, vaultIndex);
        return vaultIndex;
    }

    function lockNativeCurrency(ReleaseCheckpoint[] memory cps)
        public
        payable
        returns (uint256)
    {
        uint256 amountSent = 0;
        for (uint256 i = 0; i < cps.length; i++) {
            ReleaseCheckpoint memory cp = cps[i];
            require(
                cp.releaseTargetTimestamp > block.timestamp,
                "Date in the past selected"
            );
            require(cp.tokensCount > 0, "Empty checkpoint");

            amountSent += cp.tokensCount;
        }

        require(
            amountSent == msg.value,
            "Amount sent does not match for locks value"
        );

        //push new element to user's vault and get it's index
        userLocks[msg.sender].userVaults.push();
        uint256 vaultIndex = userLocks[msg.sender].userVaults.length - 1;

        //get created user Vault by index
        VestedTokenVault storage targetVault = userLocks[msg.sender].userVaults[
            vaultIndex
        ];

        //userLocks[msg.sender].userVaults[vaultIndex].checkpoints = new ReleaseCheckpoint[](cps.length);
        targetVault.nativeToken = true;

        for (uint256 i = 0; i < cps.length; i++) {
            ReleaseCheckpoint memory cp1 = ReleaseCheckpoint({
                id: i,
                tokensCount: cps[i].tokensCount,
                releaseTargetTimestamp: cps[i].releaseTargetTimestamp,
                claimed: false
            });

            targetVault.checkpoints.push(cp1);
        }

        emit VaultCreated(address(0), cps, vaultIndex);
        return vaultIndex;
    }

    function claimByVaultId(uint256 vaultId, uint256[] calldata checkpoints)
        public
        payable
        returns (bool)
    {
        require(vaultId >= 0, "vaultId should be positive");

        VestedTokenVault storage vault = userLocks[msg.sender].userVaults[
            vaultId
        ];

        uint256 amountSent = 0;
        for (uint256 i = 0; i < checkpoints.length; i++) {
            uint256 cpid = checkpoints[i];
            ReleaseCheckpoint storage cp = vault.checkpoints[cpid];
            require(cp.claimed == false, "Already claimed");
            require(
                cp.releaseTargetTimestamp <= block.timestamp,
                "Cannot claim before target date"
            );

            amountSent += cp.tokensCount;
            cp.claimed = true;
        }

        if (vault.nativeToken) {
            payable(msg.sender).transfer(amountSent);
        } else {
            IERC20(vault.tokenAddress).transfer(msg.sender, amountSent);
        }

        emit VaultClaimed(vaultId);
        return true;
    }

    function getUserVaults(address userAddress)
        public
        view
        returns (UserLocks memory)
    {
        return userLocks[userAddress];
    }
}

const Locker = artifacts.require("Locker");
const MockedToken = artifacts.require("MockedToken");
const moment = require("moment");

contract("Locker tests", async accounts => {
    it("token lock creation and release", async () => {
        let lockerInstance = await Locker.deployed();
        let mockedToken = await MockedToken.deployed();
        let mockTokenAddress = mockedToken.address;
        let lockerInstanceAddress = lockerInstance.address;
        let lockAmount = 1000000;
        let totalLockAmount = lockAmount * 2;
        let lockForSeconds = 5;
        //approve mock token for 2 transactions
        let approveTx = await mockedToken.approve.sendTransaction(lockerInstanceAddress, totalLockAmount);
        let approvedAmount = approveTx.logs.find(x => x.event === "Approval")?.args[2]?.toString();
        assert.equal(approvedAmount, totalLockAmount);

        //make first lock with native token
        let now = moment().unix() + lockForSeconds;
        let lockTx1 = await lockerInstance.lockNativeCurrency.sendTransaction(
            [{
                id: 0,
                tokensCount: lockAmount,
                releaseTargetTimestamp: now
            }], { value: 1000000 });
        let lockEvent1 = lockTx1.logs.find(x => x.event === "VaultCreated")?.args;
        assert.equal(lockEvent1?.index, 0);

        //make second lock
        let now2 = moment().unix() + lockForSeconds;
        let lockTx2 = await lockerInstance.lockERC20.sendTransaction(
            mockTokenAddress,
            [{
                id: 0,
                tokensCount: lockAmount / 2,
                releaseTargetTimestamp: now2 + 100000
            },
            {
                id: 3,
                tokensCount: lockAmount / 2,
                releaseTargetTimestamp: now2
            }]);
        let lockIndex2 = lockTx2.logs.find(x => x.event === "VaultCreated")?.args;
        assert.equal(lockIndex2?.index, 1);

        //check balances, tokens should be on locker contract
        let balances = await mockedToken.balanceOf.call(lockerInstanceAddress);
        assert.equal(balances.toString(), lockAmount);

        //wait for lockForSeconds to unlock
        await new Promise(res => setTimeout(res, lockForSeconds * 1000));
        let releaseLock2 = await lockerInstance.claimByVaultId.sendTransaction(1, [1]);
        let releaseLockEvent2 = releaseLock2.logs.find(x => x.event === "VaultClaimed")?.args?.index;
        assert.equal(releaseLockEvent2, 1);

        //try release native token
        await lockerInstance.claimByVaultId.sendTransaction(0, [0]);

        //check that tokens are released to sender
        let balancesAfterClaim = await mockedToken.balanceOf.call(lockerInstanceAddress);
        assert.equal(balancesAfterClaim.toString(), "500000");

        //we created 2 locks: one with 1m mether that are released after 5 secs 
        //second lock with 2 checkpoints, one releases after 5 secs (claimed), second after 100k secs
        //we should see that data 
        let finalState = await lockerInstance.getUserVaults.call(accounts[0]);
        expect(finalState.userVaults).to.deep.equal([
            [
                "0x0000000000000000000000000000000000000000",
                true,
                [["0", "1000000", now.toString(), true]]
            ],
            [
                "0xF12b5dd4EAD5F743C6BaA640B0216200e89B60Da",
                false,
                [
                    ["0", "500000", (now2 + 100_000).toString(), false],
                    ["1", "500000", now2.toString(), true]
                ]
            ]
        ]);
    });

    it("claim before release", async () => {
        let lockerInstance = await Locker.deployed();
        let lockAmount = 1000000;

        //make first lock
        let now = moment().unix();
        let lockTx = await lockerInstance.lockNativeCurrency.sendTransaction(
            [{
                id: 0,
                tokensCount: lockAmount,
                releaseTargetTimestamp: now + 10000
            }], { value: 1000000 });
        let index = lockTx.logs.find(x => x.event === "VaultCreated")?.args;
        try {
            await lockerInstance.claimByVaultId.sendTransaction(index, [0]);
        } catch {
            return;
        }

        assert.fail();
    });

    it("claim already claimed checkpoint", async () => {
        let lockerInstance = await Locker.deployed();
        let lockAmount = 1000000;

        let now = moment().unix();
        let lockTx = await lockerInstance.lockNativeCurrency.sendTransaction(
            [{
                id: 0,
                tokensCount: lockAmount,
                releaseTargetTimestamp: now + 5
            }], { value: 1000000 });
        let index = lockTx.logs.find(x => x.event === "VaultCreated")?.args?.index;

        await new Promise(res => setTimeout(res, 5 * 1000));
        await lockerInstance.claimByVaultId.sendTransaction(index, [0]);

        //double claim
        try {
            await lockerInstance.claimByVaultId.sendTransaction(index, [0]);
        } catch {
            return;
        }
        assert.fail();
    });
})
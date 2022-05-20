import moment from "moment";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { pollTx, shortAddress } from "../helpers";
import { getUserLocks } from "../reduxSlices/userLocksSlice";
import LoadingSpinner from "./LoadingSpinner";
import Big from 'big.js';
import { LOCKER_CONTRACT, TERRA_NATIVECURRENCY } from "../constants";
import { Fee, MsgExecuteContract } from "@terra-money/terra.js";
import { useConnectedWallet } from "@terra-money/wallet-provider";

const UserLocks = () => {
    const { userLocksSlice, networkSlice } = useSelector(state => state);
    const dispatch = useDispatch();

    useEffect(() => {
        if (!networkSlice.userAddress)
            return;

        dispatch(getUserLocks({ userAddress: networkSlice.userAddress }));
    }, [networkSlice.userAddress, dispatch])

    let vaultsExist = userLocksSlice.userLocks?.locks?.length > 0;

    if (!vaultsExist || !networkSlice.userAddress)
        return (<span className="lock-label last-label"></span>)

    return (
        <>
            <span className="lock-label last-label">Your locks</span>
            <div className="lock-block user-locks">
                {userLocksSlice.userLocks.locks.map((x, index) =>
                    (<UserLock key={index} lock={x} index={x.id} />))}
            </div>
        </>
    )
}

const UserLock = ({ lock, index, connectedWallet }) => {
    const dispatch = useDispatch();
    const { externalDataSlice, networkSlice } = useSelector(state => state);
    const wallet = useConnectedWallet();

    let checkpoint = lock.release_checkpoints[0];
    let vaultReleased = checkpoint.release_timestamp <= moment().unix();
    let amountToClaim = Big(checkpoint.tokens_count).div(Math.pow(10, 6));
    let untilDate = moment.unix(checkpoint.release_timestamp).format("DD/MM/YY HH:mm");
    let claimed = checkpoint.claimed;
    let availableToClaim = vaultReleased && !claimed;
    let btnclass = `big-button userlock-claim ${!availableToClaim && "disabled"}`;

    let claimButton = (
        <button
            className={btnclass}
            onClick={async () => {
                if (!availableToClaim)
                    return;

                let claimMsg = {
                    "release_by_vault_id": {
                        "vault_id": index
                    }
                }

                const transactionMsg = {
                    fee: new Fee(2000000, '200000uluna'),
                    msgs: [new MsgExecuteContract(wallet.walletAddress,
                        LOCKER_CONTRACT,
                        claimMsg)]
                };

                let tx = await wallet.post(transactionMsg);
                console.log("https://finder.terra.money/localterra/tx/" + tx.result.txhash);
                await pollTx(tx.result.txhash);
                dispatch(getUserLocks({ userAddress: networkSlice.userAddress }));
            }}
        >
            {claimed ? "Claimed" : "Claim"}
        </button >
    );

    let tokenTicker = !!lock.asset.info.NativeToken ?
        TERRA_NATIVECURRENCY.find(x => x.denom === lock.asset.info.NativeToken.denom).ticker :
        getTokenTickerByAddress(externalDataSlice.tokenList, lock.asset.info.Token.contract_addr);
    let label = `${amountToClaim} ${lock.nativeCurrency ? externalDataSlice.nativeCurrency.ticker : tokenTicker} - until ${untilDate}`;

    return (
        <div className="user-lock">
            <div className="userlock-label">
                {label}
            </div>
            {lock.loading ? <LoadingSpinner /> : claimButton}
        </div>
    )
}

const getTokenTickerByAddress = (tokenList, address) => {
    let tokenTicker = tokenList.find(x => x.address.toLowerCase() === address.toLowerCase())?.ticker;

    return tokenTicker || shortAddress(address);
};

export default UserLocks;
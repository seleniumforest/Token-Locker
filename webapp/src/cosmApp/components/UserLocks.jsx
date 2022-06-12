import moment from "moment";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { shortAddress } from "../helpers";
import { claimByVaultId, getUserLocks } from "../reduxSlices/userLocksSlice";
import LoadingSpinner from "./LoadingSpinner";
import Big from 'big.js';
import { ENV } from "../constants";

const UserLocks = () => {
    const { userLocksSlice, networkSlice } = useSelector(state => state);
    const dispatch = useDispatch();

    useEffect(() => {
        if (!networkSlice.userAddress)
            return;

        dispatch(getUserLocks({ userAddress: networkSlice.userAddress }));
    }, [networkSlice.userAddress, dispatch])

    let vaultsExist = userLocksSlice.userLocks?.length > 0;

    if (!vaultsExist || !networkSlice.userAddress)
        return (<span className="lock-label last-label"></span>)

    return (
        <>
            <span className="lock-label last-label">Your locks</span>
            <div className="lock-block user-locks">
                {userLocksSlice.userLocks.map((x, index) =>
                    (<UserLock key={index} lock={x} index={x.id} />))}
            </div>
        </>
    )
}

const UserLock = ({ lock, index }) => {
    const dispatch = useDispatch();
    const { externalDataSlice } = useSelector(state => state);

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
            onClick={() => {
                dispatch(claimByVaultId({ vaultId: index }));
            }}
        >
            {claimed ? "Claimed" : "Claim"}
        </button >
    );

    let tokenTicker = !!lock.asset.info.NativeToken ?
        ENV.ticker :
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
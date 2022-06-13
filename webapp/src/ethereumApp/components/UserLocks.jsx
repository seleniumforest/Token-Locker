import moment from "moment";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Modal from "react-responsive-modal";
import { fromBaseUnit, shortAddress } from "../helpers";
import { claimByVaultId, getUserLocks } from "../reduxSlices/userLocksSlice";
import big from 'big.js';
import { useModal } from "../hooks/useModal";

const UserLocks = () => {
    const { userLocksSlice, networkSlice, externalDataSlice } = useSelector(state => state);
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
                {userLocksSlice.userLocks.map((lock, index) => {
                    let amountToClaim = lock.checkpoints.reduce((acc, cp) => big(fromBaseUnit(cp.tokensCount)).plus(acc), 0);
                    let tokenTicker = getTokenTickerByAddress(externalDataSlice.tokenList, lock.tokenAddress);
                    let label = `${amountToClaim} ${lock.nativeCurrency ? externalDataSlice.nativeCurrency.ticker : tokenTicker}`;

                    return (
                        <div key={index} className="user-lock">
                            <div className="userlock-label">
                                {label}
                            </div>
                            <UserLockModal userLock={lock} index={index} />
                        </div>
                    )
                })}
            </div>
        </>
    )
}

const UserLockModal = ({ userLock, index }) => {
    const { open, onOpenModal, onCloseModal } = useModal();
    const dispatch = useDispatch();

    let checkpoints = userLock.checkpoints;
    let checkpointsToClaim = checkpoints.filter(x => !x.claimed).map(x => x.id);
    let atLeastTwoClaimsPossible = checkpoints
        .filter(x => !x.claimed && x.releaseTargetTimestamp <= moment().unix())
        .length > 0;

    return (
        <>
            <button
                className={"big-button"}
                onClick={async () => {
                    onOpenModal();
                }}
            >
                {"Open"}
            </button >
            <Modal
                open={open}
                onClose={onCloseModal}
                center
                classNames={{
                    overlay: 'custom-overlay',
                    modal: 'custom-modal',
                }}>
                {checkpoints.map(cp => {
                    let claimAvailable = cp.releaseTargetTimestamp <= moment().unix();

                    return (<div key={cp.id} className="tokenlist-token">
                        <label>{formatCheckpointLabel(cp, userLock.tokenInfo)}</label>
                        <button className={`big-button ${cp.claimed || !claimAvailable ? "disabled" : ""}`} onClick={() => {
                            if (cp.claimed || !claimAvailable)
                                return;

                            //TODO index != vaultId, fix in contract
                            dispatch(claimByVaultId({ vaultId: index, checkpoints: [cp.id] }))
                        }}>
                            {`${cp.claimed ? "Claimed" : "Claim"}`}
                        </button>
                    </div>);
                })}
                {atLeastTwoClaimsPossible &&
                    <div className="tokenlist-token">
                        <button className={`big-button ${checkpointsToClaim.length > 0 ? "" : "disabled"}`} onClick={async () => {
                            dispatch(claimByVaultId({
                                vaultId: index,
                                checkpoints: checkpointsToClaim
                            }))
                        }}>
                            Claim all
                        </button>
                    </div>
                }
            </Modal>
        </>);
}

const formatCheckpointLabel = (cp, tokenInfo) => {
    let readableDate = moment.unix(cp.releaseTargetTimestamp).format('DD/MM/YY, h:mm:ss a');
    let tokensCount = fromBaseUnit(cp.tokensCount, tokenInfo.decimals);
    let tokenTicker = tokenInfo.ticker;

    return `${tokensCount} ${tokenTicker} until ${readableDate}`;
}

const getTokenTickerByAddress = (tokenList, address) => {
    let tokenTicker = tokenList.find(x => x.address.toLowerCase() === address.toLowerCase())?.ticker;

    return tokenTicker || shortAddress(address);
};

export default UserLocks;
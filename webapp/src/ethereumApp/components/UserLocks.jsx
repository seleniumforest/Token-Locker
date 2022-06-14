import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import Modal from "react-responsive-modal";
import { formatCheckpointLabel, fromBaseUnit, getTokenTickerByAddress } from "../helpers";
import { claimByVaultId } from "../reduxSlices/userLocksSlice";
import big from 'big.js';
import { useModal } from "../hooks/useModal";
import { useUserLocks } from "../hooks/useUserLocks";

const UserLocks = () => {
    const { networkSlice, externalDataSlice } = useSelector(state => state);
    const userAddress = networkSlice.userAddress;
    let { userLocks } = useUserLocks(userAddress);

    let vaultsExist = userLocks?.length > 0;
    if (!vaultsExist || !userAddress)
        return (<span className="lock-label last-label"></span>)

    return (
        <>
            <span className="lock-label last-label">Your locks</span>
            <div className="lock-block user-locks">
                {userLocks.map((lock, index) => {
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
                onClick={onOpenModal}
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

export default UserLocks;
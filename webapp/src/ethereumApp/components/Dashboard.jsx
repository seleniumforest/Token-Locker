import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { formatCheckpointLabel, getTokenTickerByAddress } from '../helpers';
import { useUserLocks } from '../hooks/useUserLocks';
import big from 'big.js';
import { fromBaseUnit } from '../../cosmApp/helpers';
import { useAppSettings } from '../hooks/useAppSettings';

export const Dashboard = () => {
    const {
        metamaskDetected,
        rightNetworkSelected,
        externalDataLoaded
    } = useAppSettings();
    const params = useParams();
    const { userLocks } = useUserLocks(params.address);
    const { externalDataSlice } = useSelector(state => state);

    if (!metamaskDetected)
        return ("No metamask detected");

    if (!rightNetworkSelected)
        return ("Please switch network to Ropsten or Ganache");

    if (!externalDataLoaded)
        return ("Loading...");

    return (
        <div className="lock-blocks">
            <span className="lock-label last-label">{params.address} locks</span>
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
                            {lock?.checkpoints?.map(((rc) => {
                                return (
                                    <div key={rc.id}>
                                        {formatCheckpointLabel(rc, lock.tokenInfo) }
                                    </div>
                                )
                            }))}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
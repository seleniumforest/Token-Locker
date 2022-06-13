import React from 'react';
import "../../shared/styles/App.scss";
import NetworkSelector from './NetworkSelector';
import ApproveLockButton from './ApproveLockButton';
import TokenSelector from './TokenSelector';
import "react-datetime/css/react-datetime.css";
import UserLocks from "./UserLocks"
import DateSelector from './DateSelector';
import { useAppSettings } from '../hooks/useAppSettings';

const App = () => {
    const {
        metamaskDetected,
        rightNetworkSelected,
        externalDataLoaded
    } = useAppSettings();


    if (!metamaskDetected)
        return ("No metamask detected");

    if (!rightNetworkSelected)
        return ("Please switch network to Ropsten or Ganache");

    if (!externalDataLoaded)
        return ("Loading...");

    return (
        <>
            <NetworkSelector />
            <div className="lock">
                <div className="lock-blocks">
                    <span className="lock-label first-label">Select token to lock</span>
                    <div className="lock-block swap-addresses-from">
                        <TokenSelector />
                    </div>
                    <span className="lock-label">Release dates and amount to lock</span>
                    <div className="lock-block release-checkpoints">
                        <DateSelector />
                    </div>
                    <ApproveLockButton />
                    <UserLocks />
                </div>
            </div>
        </>
    );
}

export default App;
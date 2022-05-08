import React, { useEffect } from 'react';
import "../../shared/styles/App.scss";
import NetworkSelector from './NetworkSelector';
import ApproveLockButton from './ApproveLockButton';
import TokenSelector from './TokenSelector';
import "react-datetime/css/react-datetime.css";
import UserLocks from "./UserLocks"
import { useDispatch, useSelector } from 'react-redux';
import DateSelector from './DateSelector';
import { fetchExternalData } from '../reduxSlices/externalDataSlice';
import { WalletProvider } from '@terra-money/wallet-provider';

const TerraApp = () => {
    const { externalDataSlice } = useSelector(state => state);
    const dispatch = useDispatch();

    useEffect(() => {
        if (externalDataSlice.externalDataLoaded)
            return;

        dispatch(fetchExternalData());
    }, [dispatch, externalDataSlice.externalDataLoaded])

    if (!externalDataSlice.chainOpts)
        return "Loading...";
        
    if (!externalDataSlice.externalDataLoaded)
        return "";
        
    return (
        <>
            <WalletProvider {...externalDataSlice.chainOpts}>
                <NetworkSelector />
                <div className="lock">
                    <div className="lock-blocks">
                        <span className="lock-label first-label">Select token to lock</span>
                        <div className="lock-block swap-addresses-from">
                            <TokenSelector />
                        </div>
                        <span className="lock-label">Select date to lock until</span>
                        <div className="lock-block">
                            <DateSelector />
                        </div>
                        <ApproveLockButton />
                        <UserLocks />
                    </div>
                </div>
            </WalletProvider>
        </>
    );
}

export default TerraApp;
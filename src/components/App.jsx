import React, { useEffect } from 'react';
import "../styles/App.scss";
import NetworkSelector from './NetworkSelector';
import ApproveLockButton from './ApproveLockButton';
import TokenSelector from './TokenSelector';
import "react-datetime/css/react-datetime.css";
import UserLocks from "./UserLocks"
import { useDispatch, useSelector } from 'react-redux';
import { fetchExternalData, setNetwork } from '../reduxSlices/externalDataSlice';
import { ETH_BSC, ETH_GANACHE, ETH_ROPSTEN } from '../constants';
import { setAddress } from '../reduxSlices/networkSlice';
import Web3Utils from 'web3-utils';
import DateSelector from './DateSelector';

const App = () => {
    const { externalDataSlice } = useSelector(state => state);
    const dispatch = useDispatch();

    const isMetaMask = window?.ethereum?.isMetaMask;

    useEffect(() => {
        debugger;
        if (externalDataSlice.externalDataLoaded || !isMetaMask)
            return;

        window.ethereum.on('accountsChanged', (accounts) => {
            dispatch(setAddress({ userAddress: accounts[0] }));
        });

        window.ethereum.on('chainChanged', (chainId) => {
            dispatch(setNetwork(Web3Utils.hexToNumber(chainId)));
            dispatch(fetchExternalData());
        });

        dispatch(fetchExternalData());
    }, [dispatch, externalDataSlice.externalDataLoaded, isMetaMask])

    if (!isMetaMask)
        return ("No metamask detected");

    if (externalDataSlice.chainId !== ETH_ROPSTEN && 
        externalDataSlice.chainId !== ETH_GANACHE && 
        externalDataSlice.chainId !== ETH_BSC)
        return ("Please switch network to Ropsten");

    if (!externalDataSlice.externalDataLoaded)
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
                    <span className="lock-label">Select date to lock until</span>
                    <div className="lock-block">
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
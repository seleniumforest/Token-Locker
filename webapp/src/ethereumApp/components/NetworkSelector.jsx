import React from 'react';
import { shortAddress } from '../helpers';
import { useSelector } from 'react-redux';
import { ETH_BSC, ETH_GANACHE, ETH_ROPSTEN } from '../constants';
import { useNetwork } from '../hooks/useNetwork';

function NetworkSelector() {
    const { networkSlice, externalDataSlice } = useSelector(state => state);
    const { selectNetwork, connect, disconnect } = useNetwork("eth");

    return (
        <>
            <div className="tabs">
                <div className="tabs-switcher">
                    <button
                        className="tabs tabs-eth big-button animated shadow"
                        onClick={() => selectNetwork()}>
                        eth
                    </button>
                    <button
                        className="tabs tabs-connect animated big-button"
                        onClick={() => { networkSlice.userAddress ? disconnect() : connect() }}>
                        {getConnectButtonLabel(networkSlice, externalDataSlice)}
                    </button>
                </div>
            </div>
        </>
    );
}

const getConnectButtonLabel = (networkState, externalDataSlice) => {
    if (networkState.userAddress)
        return shortAddress(networkState.userAddress);

    let chainId = externalDataSlice.chainId;
    let networkName = "";
    if (chainId === ETH_ROPSTEN)
        networkName = "Ropsten"
    else if (chainId === ETH_GANACHE)
        networkName = "Ganache"
    else if (chainId === ETH_BSC)
        networkName = "BSC"

    return `Connect to Metamask (${networkName})`;
}

export default NetworkSelector;
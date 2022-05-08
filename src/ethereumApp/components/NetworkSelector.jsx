import React from 'react';
import { shortAddress } from '../helpers';
import { useSelector, useDispatch } from 'react-redux';
import { connectToProvider, selectNetwork, setAddress } from '../reduxSlices/networkSlice';
import { ETH_BSC, ETH_GANACHE, ETH_ROPSTEN } from '../constants';

function NetworkSelector() {
    const { networkSlice, externalDataSlice } = useSelector(state => state);
    const dispatch = useDispatch();

    return (
        <>
            <div className="tabs">
                <div className="tabs-switcher">
                    <button
                        className="tabs tabs-eth big-button animated shadow"
                        onClick={() => dispatch(selectNetwork({ network: "eth" }))}>
                        eth
                    </button>
                    <button
                        className="tabs tabs-connect animated big-button"
                        onClick={() => {
                            networkSlice.userAddress ?
                                dispatch(setAddress("")) :
                                dispatch(connectToProvider())
                        }}>
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
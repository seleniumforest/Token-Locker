import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useWallet, WalletStatus } from '@terra-money/wallet-provider';
import { shortAddress } from '../helpers';
import { Router, useNavigate } from 'react-router-dom';
import { setAddress } from '../reduxSlices/networkSlice';

function NetworkSelector() {
    const { networkSlice } = useSelector(state => state);
    const dispatch = useDispatch();

    const {
        status,
        wallets,
        connect,
        disconnect,
    } = useWallet();
    const navigate = useNavigate();

    let addresses = wallets.map(x => x.terraAddress);
    let connected = status === "WALLET_CONNECTED" && addresses.length !== 0;

    useEffect(() => {
        if (networkSlice.userAddress)
            return;

        if (connected)
            dispatch(setAddress({ userAddress: addresses[0] }));
    }, [networkSlice.userAddress, connected, dispatch, setAddress])

    return (
        <>
            <div className="tabs">
                <div className="tabs-switcher">
                    <button
                        className="tabs tabs-eth big-button animated shadow"
                        onClick={() => { navigate("/eth") }}>
                        switch to eth
                    </button>
                    <button
                        className='big-button'
                        key={'connect-EXTENSION'}
                        onClick={() => {
                            if (connected) {
                                disconnect();
                                dispatch(setAddress({ userAddress: "" }))
                            } else
                                connect("EXTENSION");
                        }}
                    >
                        {networkSlice.userAddress ? shortAddress(networkSlice.userAddress, 7, 4) : "Connect Terra Station"}
                    </button>
                </div>
            </div>
        </>
    );
}

export default NetworkSelector;
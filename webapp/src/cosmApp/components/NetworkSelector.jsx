import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { shortAddress } from '../helpers';
import { useNavigate } from 'react-router-dom';
import { setAddress } from '../reduxSlices/networkSlice';
import { ENV, JUNO_LOCAL_KEPLR_CONFIG } from '../constants';


function NetworkSelector() {
    const { networkSlice } = useSelector(state => state);
    const dispatch = useDispatch();
    const navigate = useNavigate();

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
                        onClick={async () => {
                            if (networkSlice.userAddress) {
                                dispatch(setAddress( { userAddress: "" } ))
                            }

                            await window.keplr.experimentalSuggestChain(JUNO_LOCAL_KEPLR_CONFIG);

                            await window.keplr.enable("testing");
                            const offlineSigner = window.getOfflineSigner(ENV.chainId);
                            const [firstAcc] = await offlineSigner.getAccounts();
                        
                            if (firstAcc)
                                dispatch(setAddress({ userAddress: firstAcc.address }))
                        }}
                    >
                        {networkSlice.userAddress ? shortAddress(networkSlice.userAddress, 7, 4) : "Connect Keplr"}
                    </button>
                </div>
            </div>
        </>
    );
}

export default NetworkSelector;
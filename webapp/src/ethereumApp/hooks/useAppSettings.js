import { useDispatch, useSelector } from "react-redux";
import { ETH_GANACHE, ETH_ROPSTEN } from "../constants";
import { fetchExternalData, setNetwork } from "../reduxSlices/externalDataSlice";
import { setAddress } from "../reduxSlices/networkSlice";
import Web3Utils from 'web3-utils';
import { useEffect } from "react";

export function useAppSettings() {
    const { externalDataSlice } = useSelector(state => state);
    const dispatch = useDispatch();

    const metamaskDetected = window?.ethereum?.isMetaMask;
    const rightNetworkSelected =
        externalDataSlice.chainId === ETH_ROPSTEN ||
        externalDataSlice.chainId === ETH_GANACHE;
    const externalDataLoaded = externalDataSlice.externalDataLoaded;

    useEffect(() => {
        if (externalDataLoaded || !metamaskDetected)
            return;

        window.ethereum.on('accountsChanged', (accounts) => {
            dispatch(setAddress({ userAddress: accounts[0] }));
        });

        window.ethereum.on('chainChanged', (chainId) => {
            dispatch(setNetwork(Web3Utils.hexToNumber(chainId)));
            dispatch(fetchExternalData());
        });

        dispatch(fetchExternalData());
    }, [dispatch, externalDataLoaded, metamaskDetected])

    return {
        metamaskDetected,
        rightNetworkSelected,
        externalDataLoaded
    }
}
import { ENV, ETH_BSC, ETH_GANACHE, ETH_MAINNET, ETH_ROPSTEN } from "./constants";
import { getWeb3 } from "./web3provider";
import Axios from "axios";

export const getEthTokenList = async (network) => {
    switch (network) {
        case ETH_MAINNET:
            return (await Axios.get("/tokenlist_mainnet.json")).data;
        case ETH_ROPSTEN:
            return (await Axios.get("/tokenlist_testnet.json")).data;
        case ETH_GANACHE:
            return [ENV.testToken];
        default:
            return []
    }
}

export const getNativeToken = async (network) => {
    switch (network) {
        case ETH_MAINNET:
        case ETH_ROPSTEN:
        case ETH_GANACHE:
            return ENV.nativeToken
        default:
            return []
    }
}
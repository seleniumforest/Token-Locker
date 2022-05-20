import { ETH_BSC, ETH_GANACHE, ETH_MAINNET, ETH_ROPSTEN } from "./constants";
import { getWeb3 } from "./web3provider";
import Axios from "axios";

//todo pass network as dependency
export const getEthTokenList = async () => {
    let web3 = await getWeb3();
    let network = await web3.eth.getChainId();

    switch (network) {
        case ETH_MAINNET:
            return (await Axios.get("/tokenlist_mainnet.json")).data;
        case ETH_ROPSTEN:
            return (await Axios.get("/tokenlist_testnet.json")).data;
        case ETH_GANACHE:
            return [{
                name: "Alpaca Token",
                ticker: "ALP",
                address: "0xFe7bA2E9C18c7Eb318A66b5f6CD57A5c3F4e4a32",
                totalSupply: "200000000000000000000",
                decimals: 18    
            }];
        case ETH_BSC: 
            return (await Axios.get("/tokenlist_bsc.json"))
                .data
                .tokens
                .map(x => ({
                    name: x.name,
                    ticker: x.symbol,
                    address: x.address,
                    decimals: x.decimals
                }));
        default:
            return []
    }
}

export const getNativeCurrency = async () => {
    let web3 = await getWeb3();
    let network = await web3.eth.getChainId();

    switch (network) {
        case ETH_MAINNET:
        case ETH_ROPSTEN:
        case ETH_GANACHE:
            return {
                name: "Ethereum",
                ticker: "ETH",
                native: true
            }
        case ETH_BSC:
            return {
                name: "Binance Coin",
                ticker: "BNB",
                native: true
            }
        default:
            return []
    }
}
import Axios from 'axios';
import { DEFAULT_ADDRESS, ENV, erc20Abi, ETH_GANACHE, ETH_MAINNET, ETH_ROPSTEN } from "./constants";
import { getWeb3 } from './web3provider';
import big from 'big.js';

export const shortAddress = (addr, start = 5, end = 2) =>
    `${addr.slice(0, start)}...${addr.slice(addr.length - end, addr.length)}`;

export const getLockerContract = async (network) => {
    switch (network) {
        case ETH_MAINNET:
        case ETH_ROPSTEN:
            let request1 = await Axios.get("/contracts/Locker.json");
            let locker1 = request1.data;
            return {
                abi: locker1.abi,
                address: locker1.networks["3"].address
            };
        case ETH_GANACHE:
            let request = await Axios.get("/contracts/Locker.json");
            let locker = request.data;
            return {
                abi: locker.abi,
                address: locker.networks["5777"].address
            };
        default:
            return []
    }
}

export const fromBaseUnit = (amount, decimals = 18) => {
    let demicrofied = big(amount.toString().replace(",", "."))
        .div(Math.pow(10, decimals))
        .toFixed();

    return typeof amount === "string" ? demicrofied.toString() : demicrofied;
}

export const toBaseUnit = (amount, decimals = 18) => {
    let microfied = big(amount.toString().replace(",", "."))
        .mul(Math.pow(10, decimals))
        .toFixed();

    return typeof amount === "string" ? microfied.toString() : microfied;
}

export const loadTokenByContractAddress = async (address) => {
    if (address === DEFAULT_ADDRESS) 
        return ENV.nativeToken;

    let web3 = await getWeb3();

    let contract = new web3.eth.Contract(erc20Abi, address);

    let name = await contract.methods.name().call();
    let totalSupply = await contract.methods.totalSupply().call();
    let decimals = await contract.methods.decimals().call();
    let ticker = await contract.methods.symbol().call();

    return {
        name,
        totalSupply,
        address,
        decimals,
        ticker
    }
}
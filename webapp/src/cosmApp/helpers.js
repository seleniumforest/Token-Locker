import axios from 'axios';
import Web3Utils from 'web3-utils';
import { ENV, JUNO_LOCAL, JUNO_MAINNET, JUNO_TESTNET } from "./constants";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";

export const shortAddress = (addr, start = 5, end = 2) =>
    `${addr.slice(0, start)}...${addr.slice(addr.length - end, addr.length)}`;

export const loadTokenByContractAddress = async (address) => {
    const client = await CosmWasmClient.connect(ENV.rpc);
    const response = await client.queryContractSmart(ENV.testToken.address, { token_info: {} })

    return {
        name: response.name,
        totalSupply: response.total_supply,
        address,
        decimals: response.decimals,
        ticker: response.symbol
    }
}

export const getJunoTokenList = (network) => {
    switch (network) {
        case JUNO_MAINNET:
        case JUNO_TESTNET:
        case JUNO_LOCAL:
            return [ ENV.testToken ];
        default:
            return []
    }
}

export const toBigNumber = (number) => new Web3Utils.BN(number);

export const fromBaseUnit = (value, decimals = 18) =>
    value ? Web3Utils.fromWei(value?.toString(), decimalToUnit(decimals)) : null;

export const toBaseUnit = (value, decimals = 18) =>
    value ? Web3Utils.toWei(value?.toString(), decimalToUnit(decimals)) : null;

const decimalToUnit = (decimal) => {
    switch (decimal) {
        case 18: return 'ether';
        case 15: return 'milliether';
        case 12: return 'microether';
        case 9: return 'gwei';
        case 6: return 'mwei';
        case 3: return 'kwei';
        case 1: return 'wei';
        default: return 'ether';
    }
}

export const pollTx = async (txhash) => {
    try {
        await axios.get("http://localhost:1317/txs/" + txhash);
    } catch (e) {
        await new Promise(r => setTimeout(r, 3000));
        return await pollTx(txhash);
    }
}
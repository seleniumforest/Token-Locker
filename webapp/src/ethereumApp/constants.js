import ERC20_abi from './ERC20_abi.json';

export const ETH_MAINNET = 1;
export const ETH_ROPSTEN = 3;
export const ETH_GANACHE = 1337;
export const ETH_BSC = 56;
export const erc20Abi = ERC20_abi;

const LOCAL_ENV = {
    chainId: ETH_GANACHE, 
    testToken: {
        name: "Alpaca Token",
        ticker: "ALP",
        address: "0x2F5f972B75D0D0e27fbA985AA296D99b1554B2A8",
        totalSupply: "200000000000000000000",
        decimals: 18    
    },
    nativeToken: {
        name: "Ethereum",
        ticker: "ETH",
        native: true
    }
}

export const ENV = LOCAL_ENV;
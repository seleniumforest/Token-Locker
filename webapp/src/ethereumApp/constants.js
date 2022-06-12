import ERC20_abi from './ERC20_abi.json';

export const ETH_MAINNET = 1;
export const ETH_ROPSTEN = 3;
export const ETH_GANACHE = 1337;
export const ETH_BSC = 56;
export const erc20Abi = ERC20_abi;
export const DEFAULT_ADDRESS = "0x0000000000000000000000000000000000000000";
const LOCAL_ENV = {
    chainId: ETH_GANACHE, 
    testToken: {
        name: "Mocked Token",
        ticker: "MCK",
        address: "0x4aD2590E13C486e3852AEDdd4583234636DF90E0",
        totalSupply: "200000000000000000000",
        decimals: 18    
    },
    nativeToken: {
        name: "Ethereum",
        ticker: "ETH",
        decimals: 18,
        native: true
    }
}

export const ENV = LOCAL_ENV;
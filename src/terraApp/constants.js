export const chains = [
    {
        name: "eth",
        nativeCurrency: ["ETH"]
    },
    {
        name: "bsc",
        nativeCurrency: ["BNB"]
    },
    {
        name: "terra",
        nativeCurrency: ["LUNA", "UST", "KRT"]
    }];

export const ETH_MAINNET = 1;
export const ETH_ROPSTEN = 3;
export const ETH_GANACHE = 1337;
export const ETH_BSC = 56;

export const TERRA_MAINNET = "columbus-5";
export const TERRA_TESTNET = "bombay-12";
export const TERRA_LOCAL = "localterra";
export const TERRA_NATIVECURRENCY = [
    { ticker: "LUNA", denom: "uluna" }, 
    { ticker: "UST", denom: "uusd" }, 
    { ticker: "KRT", denom: "ukrw" }];

export const LOCKER_CONTRACT = "terra1zw0kfxrxgrs5l087mjm79hcmj3y8z6tljuhpmc"//"terra13aktep558cx6lny74c8st5qwt0jj66zgr7yz93";

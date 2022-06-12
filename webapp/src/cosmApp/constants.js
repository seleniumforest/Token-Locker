export const JUNO_MAINNET = "juno-1";
export const JUNO_TESTNET = "uni-2";
export const JUNO_LOCAL = "testing";

const LOCAL_ENV = {
    rpc: "http://localhost:26657",
    rest: "http://localhost:1317",
    chainId: JUNO_LOCAL,
    ticker: "Juno",
    denom: "ujunox",
    decimals: 6,
    lockerContract: "juno1xr3rq8yvd7qplsw5yx90ftsr2zdhg4e9z60h5duusgxpv72hud3skqksyr",
    testToken: {
        name: "Alpaca", 
        ticker: "ALP",
        address: "juno14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9skjuwg8",
        decimals: 6,
        isNative: false
    }
}

export const ENV = LOCAL_ENV;

export const JUNO_LOCAL_KEPLR_CONFIG = {
    chainId: "testing",
    chainName: "Juno local",
    rpc: "http://localhost:26657",
    rest: "http://localhost:1317",
    bip44: {
        coinType: 118,
    },
    bech32Config: {
        bech32PrefixAccAddr: "juno",
        bech32PrefixAccPub: "junopub",
        bech32PrefixValAddr: "junovaloper",
        bech32PrefixValPub: "junovaloperpub",
        bech32PrefixConsAddr: "junovalcons",
        bech32PrefixConsPub: "junovalconspub",
    },
    currencies: [
        {
            coinDenom: "JUNO",
            coinMinimalDenom: "ujunox",
            coinDecimals: 6,
            coinGeckoId: "juno",
        },
    ],
    feeCurrencies: [
        {
            coinDenom: "JUNO",
            coinMinimalDenom: "ujunox",
            coinDecimals: 6,
            coinGeckoId: "juno",
        },
    ],
    stakeCurrency: {
        coinDenom: "UJUNO",
        coinMinimalDenom: "ujunox",
        coinDecimals: 6,
        coinGeckoId: "juno",
    },
    coinType: 118,
    gasPriceStep: {
        low: 0.01,
        average: 0.025,
        high: 0.03,
    },
};
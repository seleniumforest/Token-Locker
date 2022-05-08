import { Coins, LCDClient } from "@terra-money/terra.js";

export const getTerraLcd = (chainOpts) => {
    // const gasPrices = await (await fetch('https://bombay-fcd.terra.dev/v1/txs/gas_prices')).json();
    // const gasPricesCoins = new Coins(gasPrices);

    let net = chainOpts.defaultNetwork;
    const lcd = new LCDClient({
        URL: net.lcd,
        chainID: net.chainID
        // ,gasPrices: gasPricesCoins,
        // gasAdjustment: "1.5",
        // gas: 10000000,
    });

    return lcd; 
}

export const getLocalTerraLcd = async () => {
    const lcd = new LCDClient({
        URL: "http://localhost:1317",
        chainID: "localterra"
    });

    return lcd; 
}
import tokenList from "./tokens";
import { TERRA_LOCAL, TERRA_MAINNET, TERRA_TESTNET } from "./constants";

export const getTerraTokenList = async (network) => {
    switch (network) {
        case TERRA_MAINNET:
            return tokenList.mainnet;
        case TERRA_TESTNET:
            return tokenList.testnet;
        case TERRA_LOCAL:
        default:
            return []
    }
}

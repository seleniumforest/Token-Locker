import { useState } from "react";
import { useSelector } from "react-redux";
import { loadTokenByContractAddress } from "../helpers";

export const useTokenFilter = () => {
    const { externalDataSlice } = useSelector(state => state);

    const fullTokenList = [
        externalDataSlice.nativeCurrency,
        ...externalDataSlice.tokenList
    ];
    const [shownTokens, setShownTokens] = useState(fullTokenList);

    const filter = async (event) => {
        let userInput = event.target.value.toLowerCase();

        if (userInput.length === 42 &&
            userInput.toLowerCase().startsWith("0x")) {
            let importedToken = await loadTokenByContractAddress(userInput);
            setShownTokens([importedToken]);
            return;
        }

        if (!userInput)
            setShownTokens(fullTokenList);

        let filtered = fullTokenList.filter(token => {
            let ticker = token.ticker.toLowerCase();
            let name = token.name.toLowerCase();

            return ticker.startsWith(userInput) ||
                name.startsWith(userInput);
        });

        setShownTokens(filtered);
    }

    return {
        filter, 
        shownTokens
    }
}
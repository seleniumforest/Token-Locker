import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fromBaseUnit } from '../helpers';
import { getSelectedTokenBalance, selectToken, setTokenAmount } from '../reduxSlices/tokenSelectorSlice';
import SelectTokenModal from './SelectTokenModal';

const TokenSelector = () => {
    const { networkSlice, tokenSelectorSlice, externalDataSlice } = useSelector(state => state);
    const dispatch = useDispatch();

    const selectedToken = tokenSelectorSlice.selectedToken;
    const tokenList = externalDataSlice.tokenList;

    useEffect(() => {
        if (selectedToken.ticker)
            return;

        dispatch(selectToken(externalDataSlice.nativeCurrency));
    }, [dispatch, selectedToken.ticker, tokenList, externalDataSlice.nativeCurrency]);

    useEffect(() => {
        if (!networkSlice.userAddress)
            return;

        dispatch(getSelectedTokenBalance({
            tokenAddress: selectedToken.address,
            userAddress: networkSlice.userAddress,
            isNativeCurrency: selectedToken.native
        }));
    }, [dispatch, networkSlice.userAddress, selectedToken.address, selectedToken.native])

    let balanceLabel = tokenSelectorSlice.balance && networkSlice.userAddress ? (
        <div className="token-user-balance">
            balance: {fromBaseUnit(tokenSelectorSlice.balance, selectedToken.decimals)}
        </div>
    ) : null;

    return (
        <>
            <SelectTokenModal />
            <input className="big-input"
                onChange={(e) => {
                    let amount = e.target.value.replace(",", ".");
                    dispatch(setTokenAmount(amount));
                }}
                placeholder="Amount"
                type="number"
                value={tokenSelectorSlice.amount} />
            {balanceLabel}
        </>
    );
}

export default TokenSelector;
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fromBaseUnit } from '../helpers';
import { getSelectedTokenBalance, selectToken } from '../reduxSlices/tokenSelectorSlice';
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

        dispatch(getSelectedTokenBalance());
    }, [dispatch, networkSlice.userAddress, selectedToken.address, selectedToken.native])

    return (
        <>
            <SelectTokenModal />
            {!!tokenSelectorSlice.balance && networkSlice.userAddress &&
                <div className="token-user-balance">
                    balance: {fromBaseUnit(tokenSelectorSlice.balance, selectedToken.decimals)}
                </div>
            }
        </>
    );
}

export default TokenSelector;
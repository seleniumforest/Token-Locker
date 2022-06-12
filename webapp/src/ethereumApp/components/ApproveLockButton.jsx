import moment from 'moment';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fromBaseUnit, toBaseUnit } from '../helpers';
import { approveToken, getSelectedTokenApproval, lockToken } from '../reduxSlices/tokenSelectorSlice';
import LoadingSpinner from './LoadingSpinner';

const ApproveLockButton = () => {
    const { tokenSelectorSlice, externalDataSlice, networkSlice } = useSelector(state => state);
    const dispatch = useDispatch();

    const selectedToken = tokenSelectorSlice.selectedToken;

    useEffect(() => {
        if (!networkSlice.userAddress ||
            !selectedToken.address)
            return;

        dispatch(getSelectedTokenApproval());

    }, [
        networkSlice.userAddress,
        selectedToken.address,
        dispatch
    ])

    if (!networkSlice.userAddress)
        return null;

    if (tokenSelectorSlice.isApproveLockLoading)
        return (<LoadingSpinner />)

    return selectedToken.native ?
        <ApproveLockBtnForEth /> :
        <ApproveLockBtnForErc20 />
};

const ApproveLockBtnForEth = () => {
    const { tokenSelectorSlice, networkSlice } = useSelector(state => state);
    const dispatch = useDispatch();

    let balance = fromBaseUnit(tokenSelectorSlice.balance);
    let totalAmount = tokenSelectorSlice.releaseCheckpoints.reduce((acc, rc) => Number(rc.tokensCount) + acc, 0);
    let allAmountsFilled = tokenSelectorSlice.releaseCheckpoints.reduce((acc, rc) => acc && Number(rc.tokensCount) > 0, true);
    let allDatesAreInFuture = tokenSelectorSlice.releaseCheckpoints.reduce((acc, rc) => acc && rc.releaseTargetTimestamp > moment().unix(), true);
    let valid = Number(totalAmount) > 0 &&
        Number(totalAmount) <= Number(balance) &&
        allDatesAreInFuture &&
        allAmountsFilled;

    let btnclass = `lock-button animated big-button ${!valid && "disabled"}`;
    let lockBtn = (<button
        className={btnclass}
        onClick={() => {
            if (!valid)
                return;

            let selToken = tokenSelectorSlice.selectedToken;

            let action = lockToken({
                isNative: selToken.native,
                lockUntil: tokenSelectorSlice.lockUntil.toString(),
                amount: toBaseUnit(tokenSelectorSlice.amount),
                tokenAddress: selToken.address,
                userAddress: networkSlice.userAddress
            });

            dispatch(action);
        }}>
        Lock
    </button>);

    return lockBtn;
}

const ApproveLockBtnForErc20 = () => {
    const { tokenSelectorSlice, networkSlice } = useSelector(state => state);
    const dispatch = useDispatch();

    let selToken = tokenSelectorSlice.selectedToken;
    let balance = fromBaseUnit(tokenSelectorSlice.balance, selToken.decimals);
    let totalAmount = tokenSelectorSlice.releaseCheckpoints.reduce((acc, rc) => Number(rc.tokensCount) + acc, 0);
    let allDatesAreInFuture = tokenSelectorSlice.releaseCheckpoints.reduce((acc, rc) => acc && rc.releaseTargetTimestamp > moment().unix(), true);
    let allAmountsFilled = tokenSelectorSlice.releaseCheckpoints.reduce((acc, rc) => acc && Number(rc.tokensCount) > 0, true);
    let valid = selToken.address &&
        Number(totalAmount) > 0 &&
        Number(totalAmount) <= Number(balance) &&
        allDatesAreInFuture &&
        allAmountsFilled;

    let approved = Number(fromBaseUnit(tokenSelectorSlice.approvedAmount, selToken.decimals)) >= Number(totalAmount);
    let btnclass = `lock-button animated big-button ${!valid && "disabled"}`;

    return (<button
        className={btnclass}
        onClick={() => {
            if (!valid)
                return;

            let action = approved ?
                lockToken() : 
                approveToken();

            dispatch(action);
        }}>
        {approved ? "Lock" : "Approve"}
    </button>)
}

export default ApproveLockButton;
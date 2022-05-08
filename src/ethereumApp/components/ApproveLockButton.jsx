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

        dispatch(getSelectedTokenApproval({
            spenderAddress: externalDataSlice.locker.address,
            userAddress: networkSlice.userAddress,
            selectedTokenAddress: selectedToken.address
        }));

    }, [
        networkSlice.userAddress,
        selectedToken.address,
        externalDataSlice.locker.address,
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
    let valid = Number(tokenSelectorSlice.amount) > 0 &&
        Number(tokenSelectorSlice.amount) <= Number(balance) &&
        tokenSelectorSlice.lockUntil > moment().unix();

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
    let valid = selToken.address &&
        Number(tokenSelectorSlice.amount) > 0 &&
        Number(tokenSelectorSlice.amount) <= Number(balance) &&
        tokenSelectorSlice.lockUntil > moment().unix();

    let approved = Number(fromBaseUnit(tokenSelectorSlice.approvedAmount, selToken.decimals)) >= Number(tokenSelectorSlice.amount);
    let btnclass = `lock-button animated big-button ${!valid && "disabled"}`;

    if (approved)
        return (<button
            className={btnclass}
            onClick={() => {
                if (!valid)
                    return;

                let action = lockToken({
                    isNative: selToken.native,
                    lockUntil: tokenSelectorSlice.lockUntil.toString(),
                    amount: toBaseUnit(tokenSelectorSlice.amount, selToken.decimals),
                    tokenAddress: selToken.address,
                    userAddress: networkSlice.userAddress
                });

                dispatch(action);
            }}>
            Lock
        </button>);

    return (
        <button
            className={btnclass}
            onClick={() => {
                if (!valid)
                    return;

                let action = approveToken({
                    tokenAddress: tokenSelectorSlice.selectedToken.address, 
                    approveAmount: tokenSelectorSlice.selectedToken.totalSupply
                });

                dispatch(action);
            }}>
            Approve
        </button>
    );
}

export default ApproveLockButton;
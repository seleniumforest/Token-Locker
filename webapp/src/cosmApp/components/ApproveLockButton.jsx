import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import LoadingSpinner from './LoadingSpinner';
import { getUserLocks } from '../reduxSlices/userLocksSlice';
import { getSelectedTokenBalance, lockToken } from '../reduxSlices/tokenSelectorSlice';

const ApproveLockButton = () => {
    const { tokenSelectorSlice, networkSlice } = useSelector(state => state);
    const dispatch = useDispatch();
    const token = tokenSelectorSlice.selectedToken;
    
    if (!networkSlice.userAddress)
        return null;

    if (tokenSelectorSlice.isApproveLockLoading)
        return (<LoadingSpinner />)

    let disabled = !tokenSelectorSlice.amount ||
        !tokenSelectorSlice.lockUntil ? "disabled" : "";

    return (
        <button
            className={"big-button"}
            disabled={disabled}
            onClick={() => {
                dispatch(lockToken({ 
                    token: tokenSelectorSlice.selectedToken,  
                    lockUntil: tokenSelectorSlice.lockUntil,
                    amount: tokenSelectorSlice.amount
                }));
            }}
        >
            Lock
        </button>
    )
};

export default ApproveLockButton;
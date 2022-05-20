import React from 'react';
import Datetime from 'react-datetime';
import "react-datetime/css/react-datetime.css";
import moment from "moment";
import { useDispatch, useSelector } from 'react-redux';
import { setLockUntil } from '../reduxSlices/tokenSelectorSlice';

const DateSelector = () => {
    const { tokenSelectorSlice, networkSlice } = useSelector(state => state);
    const dispatch = useDispatch();

    let dateInvalid = tokenSelectorSlice.lockUntil < moment().unix() &&
        networkSlice.userAddress &&
        Number(tokenSelectorSlice.amount) > 0;

    return (
        <>
            <Datetime
                isValidDate={current => (current.isAfter(moment().subtract(1, "day")))}
                onChange={(e) => {
                    let time = e instanceof moment ? e.unix() : 0;
                    dispatch(setLockUntil(time));
                }}
                className={dateInvalid ? "red-rdt" : ""} />
        </>
    );
}

export default DateSelector;
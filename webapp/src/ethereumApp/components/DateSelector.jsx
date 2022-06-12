import React, { Fragment } from 'react';
import Datetime from 'react-datetime';
import "react-datetime/css/react-datetime.css";
import moment from "moment";
import { useDispatch, useSelector } from 'react-redux';
import { addReleaseCheckpoint, setLockUntil, setTokenAmount } from '../reduxSlices/tokenSelectorSlice';

const DateSelector = () => {
    const { tokenSelectorSlice } = useSelector(state => state);
    const dispatch = useDispatch();

    let releaseCheckpoints = tokenSelectorSlice.releaseCheckpoints;
    let lastCheckpointId = releaseCheckpoints[releaseCheckpoints.length - 1].id;

    let btn = <button className='big-button' onClick={() => {
        dispatch(addReleaseCheckpoint());
    }}>+</button>

    return (
        <>
            {releaseCheckpoints.map(rc => {
                return (
                    <Fragment key={rc.id}>
                        <ReleaseCheckpoint checkpointData={rc} />
                        {rc.id === lastCheckpointId && btn}
                    </Fragment>
                );
            })}
        </>
    );
}

const ReleaseCheckpoint = ({ checkpointData }) => {
    const { networkSlice } = useSelector(state => state);
    const dispatch = useDispatch();

    let dateInvalid = checkpointData.releaseTargetTimestamp < moment().unix() &&
        networkSlice.userAddress;

    return (<div>
        <label>{checkpointData.id}</label>
        <Datetime
            isValidDate={current => (current.isAfter(moment().subtract(1, "day")))}
            onChange={(e) => {
                let time = e instanceof moment ? e.unix() : 0;
                dispatch(setLockUntil({ time, id: checkpointData.id }));
            }}
            className={dateInvalid ? "red-rdt" : ""} />
        <input className="big-input"
            onChange={(e) => {
                let amount = e.target.value.replace(",", ".");
                dispatch(setTokenAmount({ amount, id: checkpointData.id }));
            }}
            placeholder="Amount"
            type="number"
            value={checkpointData.tokensCount} />
    </div>)
}

export default DateSelector;
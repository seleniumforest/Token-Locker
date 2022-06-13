import React, { Fragment } from 'react';
import Datetime from 'react-datetime';
import "react-datetime/css/react-datetime.css";
import moment from "moment";
import { useDispatch, useSelector } from 'react-redux';
import { addReleaseCheckpoint } from '../reduxSlices/tokenSelectorSlice';
import { useCheckpoint } from '../hooks/useCheckpoint';

const DateSelector = () => {
    const { tokenSelectorSlice } = useSelector(state => state);
    const dispatch = useDispatch();

    let releaseCheckpoints = tokenSelectorSlice.releaseCheckpoints;
    let lastCheckpointId = releaseCheckpoints[releaseCheckpoints.length - 1].id;

    return (
        <>
            {releaseCheckpoints.map(rc => {
                return (
                    <Fragment key={rc.id}>
                        <ReleaseCheckpoint checkpointData={rc} />
                        {rc.id === lastCheckpointId &&
                            <button className='big-button' onClick={() => {
                                dispatch(addReleaseCheckpoint());
                            }}>Add checkpoint</button>
                        }
                    </Fragment>
                );
            })}
        </>
    );
}

const ReleaseCheckpoint = ({ checkpointData }) => {
    const { networkSlice } = useSelector(state => state);
    const { 
        setAmount,
        setReleaseTimestamp
    } = useCheckpoint(checkpointData.id);
    let dateInvalid = checkpointData.releaseTargetTimestamp < moment().unix() &&
        networkSlice.userAddress;

    return (<div>
        <label>{checkpointData.id}</label>
        <Datetime
            isValidDate={current => (current.isAfter(moment().subtract(1, "day")))}
            onChange={setReleaseTimestamp}
            className={dateInvalid ? "red-rdt" : ""} />
        <input className="big-input"
            onChange={setAmount}
            placeholder="Amount"
            type="number"
            value={checkpointData.tokensCount} />
    </div>)
}

export default DateSelector;
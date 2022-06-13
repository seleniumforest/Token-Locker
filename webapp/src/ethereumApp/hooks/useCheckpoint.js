import moment from "moment";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { setLockUntil, setTokenAmount } from "../reduxSlices/tokenSelectorSlice";

export function useCheckpoint(id) {
    const dispatch = useDispatch();

    const setAmount = useCallback((e) => {
        let amount = e.target.value.replace(",", ".");
        dispatch(setTokenAmount({ amount, id }));
    }, [id, dispatch]);

    const setReleaseTimestamp = useCallback((e) => {
        let time = e instanceof moment ? e.unix() : 0;
        dispatch(setLockUntil({ time, id: id }));
    }, [id, dispatch]);

    return {
        setAmount,
        setReleaseTimestamp
    }
}
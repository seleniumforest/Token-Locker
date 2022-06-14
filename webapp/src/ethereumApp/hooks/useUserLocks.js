import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getUserLocks } from "../reduxSlices/userLocksSlice";

export const useUserLocks = (userAddress) => {
    const { userLocksSlice, externalDataSlice } = useSelector(state => state);
    const dispatch = useDispatch();

    useEffect(() => {
        if (!userAddress || !externalDataSlice.externalDataLoaded)
            return;

        dispatch(getUserLocks({ userAddress }));
    }, [userAddress, dispatch, externalDataSlice.externalDataLoaded])

    return { 
        userLocks: userLocksSlice.userLocks
    }
}
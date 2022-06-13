import { useDispatch } from "react-redux";
import { connectToProvider, selectNetwork, setAddress } from "../reduxSlices/networkSlice";

export function useNetwork(name) {
    const dispatch = useDispatch();

    return {
        selectNetwork: () => dispatch(selectNetwork({ network: name })),
        disconnect: () => dispatch(setAddress("")),
        connect: () => dispatch(connectToProvider())
    }
}
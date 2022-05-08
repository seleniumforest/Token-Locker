import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

const initialState = {
    network: "terra",
    userAddress: ""
};

export const networkSlice = createSlice({
    name: 'networkSlice',
    initialState,
    reducers: {
        selectNetwork: (state, action) => {
            state.network = action.payload.network;
        },
        setAddress: (state, action) => {
            state.userAddress = action.payload.userAddress
        }
    }
});

export const { selectNetwork, setAddress } = networkSlice.actions;

export default networkSlice.reducer;

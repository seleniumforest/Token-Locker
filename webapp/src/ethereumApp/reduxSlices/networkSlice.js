import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

const initialState = {
    network: "eth",
    userAddress: ""
};

export const connectToProvider = createAsyncThunk(
    'network/connectToProvider',
    async () => {
        let request = await window.ethereum.request({ method: 'eth_requestAccounts' });
        return request[0];
    }
);

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
    },
    extraReducers: (builder) => {
        builder
            .addCase(connectToProvider.fulfilled, (state, action) => {
                state.userAddress = action.payload;
            });
    },
});

export const { selectNetwork, setAddress } = networkSlice.actions;

export default networkSlice.reducer;

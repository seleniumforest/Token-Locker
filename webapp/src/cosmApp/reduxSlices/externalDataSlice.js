import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ENV } from '../constants';
import { getJunoTokenList } from '../helpers';

const initialState = {
    tokenList: {}
};

export const fetchExternalData = createAsyncThunk(
    'externalData/fetchExternalData',
    async () => {
        let tokenList = (await getJunoTokenList("testing"));

        let nativeCurrency = { 
            ticker: ENV.ticker, 
            denom: ENV.denom, 
            decimals: ENV.decimals,
            isNative: true 
        };
        
        return { tokenList, nativeCurrency };
    }
);

export const externalDataSlice = createSlice({
    name: 'externalDataSlice',
    initialState,
    reducers: {
        setNetwork: (state, action) => {
            state.chainId = action.payload
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchExternalData.fulfilled, (state, action) => {
                state.chainOpts = action.payload.chainOpts;
                state.tokenList = action.payload.tokenList;
                state.nativeCurrency = action.payload.nativeCurrency;
                state.externalDataLoaded = true;
            });
    },
});

export const { setNetwork } = externalDataSlice.actions;

export default externalDataSlice.reducer;

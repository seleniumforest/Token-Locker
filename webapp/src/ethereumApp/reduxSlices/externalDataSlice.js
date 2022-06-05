import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getLockerContract } from '../helpers';
import { getEthTokenList, getNativeToken } from '../tokenLists';
import { getWeb3 } from '../web3provider';

const initialState = {
    externalDataLoaded: false,
    tokenList: [],
    locker: {},
    nativeCurrency: {},
    chainId: -1
};

export const fetchExternalData = createAsyncThunk(
    'externalData/fetchExternalData',
    async () => {
        let web3 = await getWeb3();
        let chainId = await web3.eth.getChainId();
        let list = await getEthTokenList(chainId);
        let contract = await getLockerContract();
        let nativeCurrency = await getNativeToken(chainId);

        return { 
            tokenList: list, 
            lockerContract: contract, 
            nativeCurrency, 
            chainId  
        };
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
                state.tokenList = [ ...action.payload.tokenList ];
                state.locker= action.payload.lockerContract;
                state.nativeCurrency = action.payload.nativeCurrency;
                state.chainId = action.payload.chainId;
                state.externalDataLoaded = true;
            });
    },
});

export const { setNetwork } = externalDataSlice.actions;

export default externalDataSlice.reducer;

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getChainOptions } from '@terra-money/wallet-provider';
import { TERRA_NATIVECURRENCY } from '../constants';
import { getLockerContract } from '../helpers';
import { getEthTokenList, getNativeCurrency, getTerraTokenList } from '../tokenLists';

const initialState = {
    chainOpts: {},
    tokenList: {}
};

export const fetchExternalData = createAsyncThunk(
    'externalData/fetchExternalData',
    async () => {
        let chainOpts = await getChainOptions();
        let tokenList = (await getTerraTokenList(chainOpts.defaultNetwork.chainID));

        tokenList = Object.keys(tokenList)
            .map(y => {
                let x = tokenList[y];

                return {
                    name: x.name ?? x.protocol + " " + x.symbol,
                    ticker: x.symbol,
                    address: x.token,
                    native: false   
                }
            });

        let nativeCurrency = TERRA_NATIVECURRENCY.map(x => ({ 
            ticker: x.ticker, 
            denom: x.denom, 
            native: true }));
            
        return { tokenList, chainOpts, nativeCurrency };
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

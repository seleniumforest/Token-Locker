import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { LOCKER_CONTRACT } from '../constants';
import { getLocalTerraLcd } from "../web3provider";

const initialState = {
    userLocks: []
};

export const getUserLocks = createAsyncThunk(
    'userLocks/getUserLocks',
    async ({ userAddress }) => {
        try {
            let lcd = await getLocalTerraLcd();
            let queryMsg = { 
                "get_user_vaults": {
                    "user_address": userAddress
                }
            }

            const locks = await lcd.wasm.contractQuery(LOCKER_CONTRACT, queryMsg);
            return locks;
        }
        catch (e) { console.log(e); }
    }
);

export const claimByVaultId = createAsyncThunk(
    'userLocks/claimByVaultId',
    async ({ vaultId }, thunkApi) => {
        try {
            
        }
        catch (e) { throw (e) }
    }
);

export const userLocksSlice = createSlice({
    name: 'userLocksSlice',
    initialState,
    reducers: {
    },
    extraReducers: (builder) => {
        builder
            .addCase(claimByVaultId.pending, (state, action) => {
                state.userLocks = setLoadingForVault(action.meta.arg.vaultId, state.userLocks, true);
            })
            .addCase(claimByVaultId.rejected, (state, action) => {
                state.userLocks = setLoadingForVault(action.meta.arg.vaultId, state.userLocks, false);
            })
            .addCase(getUserLocks.fulfilled, (state, action) => {
                state.userLocks = action.payload;
            })
    }
});

const setLoadingForVault = (vaultId, userLocks, value) => {
    let newLocks = [...userLocks];
    let current = { ...newLocks[vaultId] };
    current.loading = value;
    newLocks[vaultId] = current;
    return newLocks;
}

export default userLocksSlice.reducer;

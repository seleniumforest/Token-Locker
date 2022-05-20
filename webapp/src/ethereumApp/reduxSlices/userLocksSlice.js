import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getLockerContract } from '../helpers';
import { getWeb3 } from '../web3provider';
import { getSelectedTokenBalance } from './tokenSelectorSlice';

const initialState = {
    userLocks: []
};

export const getUserLocks = createAsyncThunk(
    'userLocks/getUserLocks',
    async ({ userAddress }) => {
        try {
            let web3 = await getWeb3();
            let locker = await getLockerContract();
            let contract = new web3.eth.Contract(locker.abi, locker.address)
            let locks = await contract
                .methods
                .getUserVaults(userAddress)
                .call();

            let a =  locks.userVaults.map(y => ({
                loading: false,
                tokenAddress: y.tokenAddress,
                nativeCurrency: y.nativeToken,
                checkpoints: y.checkpoints.map(z => ({
                    claimed: z.claimed,
                    releaseTargetTimestamp: z.releaseTargetTimestamp,
                    tokensCount: z.tokensCount
                }))
            }));
            return a;
        }
        catch (e) { console.log(e); }
    }
);

export const claimByVaultId = createAsyncThunk(
    'userLocks/claimByVaultId',
    async ({ vaultId }, thunkApi) => {
        try {
            let web3 = await getWeb3();
            let locker = await getLockerContract();
            let contract = new web3.eth.Contract(locker.abi, locker.address)

            let result = await contract
                .methods
                .claimByVaultId(vaultId)
                .send({ from: window.ethereum.selectedAddress });

            let state = thunkApi.getState();
            await thunkApi.dispatch(getSelectedTokenBalance({
                tokenAddress: state.tokenSelectorSlice.selectedToken.address,
                userAddress: state.networkSlice.userAddress,
                isNativeCurrency: state.tokenSelectorSlice.selectedToken.native
            }));
            await thunkApi.dispatch(getUserLocks({ userAddress: state.networkSlice.userAddress }));

            if (!result.status) throw Error("Claim failed");
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

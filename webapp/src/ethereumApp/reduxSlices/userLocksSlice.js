import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getLockerContract, loadTokenByContractAddress } from '../helpers';
import { getWeb3 } from '../web3provider';
import { getSelectedTokenBalance } from './tokenSelectorSlice';
import structuredClone from '@ungap/structured-clone';

const initialState = {
    userLocks: []
};

export const getUserLocks = createAsyncThunk(
    'userLocks/getUserLocks',
    async ({ userAddress }, { getState }) => {
        try {
            let state = getState();
            let locker = structuredClone(state.externalDataSlice.locker);
            let web3 = getWeb3();
            let contract = new web3.eth.Contract(locker.abi, locker.address);
            let locks = await contract
                .methods
                .getUserVaults(userAddress)
                .call();

            let formattedLocks = locks.userVaults.map(async y => ({
                loading: false,
                tokenAddress: y.tokenAddress,
                tokenInfo: await loadTokenByContractAddress(y.tokenAddress),
                nativeCurrency: y.nativeToken,
                checkpoints: y.checkpoints.map(z => ({
                    id: z.id,
                    claimed: z.claimed,
                    releaseTargetTimestamp: z.releaseTargetTimestamp,
                    tokensCount: z.tokensCount
                }))
            }));
            
            return await Promise.all(formattedLocks);
        }
        catch (e) { console.log(e); }
    }
);

export const claimByVaultId = createAsyncThunk(
    'userLocks/claimByVaultId',
    async ({ vaultId, checkpoints }, {getState , dispatch}) => {
        try {
            let web3 = await getWeb3();
            let state = getState();
            let locker = structuredClone(state.externalDataSlice.locker);
            let contract = new web3.eth.Contract(locker.abi, locker.address);

            let result = await contract
                .methods
                .claimByVaultId(vaultId, checkpoints)
                .send({ from: window.ethereum.selectedAddress });

            await dispatch(getSelectedTokenBalance({
                tokenAddress: state.tokenSelectorSlice.selectedToken.address,
                userAddress: state.networkSlice.userAddress,
                isNativeCurrency: state.tokenSelectorSlice.selectedToken.native
            }));
            await dispatch(getUserLocks({ userAddress: state.networkSlice.userAddress }));

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

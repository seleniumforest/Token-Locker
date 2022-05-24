import { createAsyncThunk, createSlice, current } from '@reduxjs/toolkit';
import { ENV } from '../constants';
import { CosmWasmClient, SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { GasPrice } from '@cosmjs/stargate';
import { getSelectedTokenBalance } from './tokenSelectorSlice';

const initialState = {
    userLocks: []
};

export const getUserLocks = createAsyncThunk(
    'userLocks/getUserLocks',
    async ({ userAddress }) => {
        try {
            let lcd = await CosmWasmClient.connect(ENV.rpc);
            let queryMsg = {
                "get_user_vaults": {
                    "user_address": userAddress
                }
            }

            const response = await lcd.queryContractSmart(ENV.lockerContract, queryMsg);
            return response.locks;
        }
        catch (e) { console.log(e); }
    }
);

export const claimByVaultId = createAsyncThunk(
    'userLocks/claimByVaultId',
    async ({ vaultId }, thunkApi) => {
        try {
            const chainId = ENV.chainId;
            await window.keplr.enable(chainId);
            const offlineSigner = window.getOfflineSigner(chainId);
            const [firstAcc] = await offlineSigner.getAccounts();

            let claimMsg = {
                typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
                value: {
                    sender: firstAcc.address,
                    contract: ENV.lockerContract,
                    msg: Buffer.from(JSON.stringify({
                        release_by_vault_id: {
                            vault_id: vaultId
                        }
                    }))
                }
            };

            const client = await SigningCosmWasmClient.connectWithSigner(
                ENV.rpc,
                offlineSigner,
                {
                    gasPrice: GasPrice.fromString(`0.1${ENV.denom}`)
                }
            )

            let result = await client.signAndBroadcast(
                firstAcc.address,
                [claimMsg],
                "auto")

            console.log(result);

        }
        catch (e) { throw (e) }


        let state = thunkApi.getState();
        let token = state.tokenSelectorSlice.selectedToken;
        let userAddress = state.networkSlice.userAddress;
        thunkApi.dispatch(getUserLocks({ userAddress }));
        thunkApi.dispatch(getSelectedTokenBalance({
            tokenAddress: token.address,
            userAddress,
            isNativeCurrency: token.isNative
        }))
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
                state.userLocks = setLoadingForVault(action.meta.arg.vaultId, current(state).userLocks, true);
            })
            .addCase(claimByVaultId.rejected, (state, action) => {
                state.userLocks = setLoadingForVault(action.meta.arg.vaultId, current(state).userLocks, false);
            })
            .addCase(claimByVaultId.fulfilled, (state, action) => {
                state.userLocks = setLoadingForVault(action.meta.arg.vaultId, current(state).userLocks, false);
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

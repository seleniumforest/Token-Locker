import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { loadTokenByContractAddress } from '../helpers';
import { CosmWasmClient, SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { GasPrice } from "@cosmjs/stargate";
import { ENV } from '../constants';
import Big from 'big.js';
import { getUserLocks } from './userLocksSlice';

const initialState = {
    selectedToken: {},
    approvedAmount: 0,
    amount: "0",
    balance: 0,
    lockUntil: 0,
    isApproveLockLoading: false
};

//todo refactor - make 2 thunks for tokens and native denoms and make smth with gas
// move wallet initialization to helpers
export const lockToken = createAsyncThunk(
    'tokenSelector/lockToken',
    async ({ token, lockUntil, amount }, { getState, dispatch }) => {
        try {
            let lockAmount = new Big(amount).mul(Math.pow(10, token.decimals)).toString();
            const chainId = ENV.chainId;
            await window.keplr.enable(chainId);
            const offlineSigner = window.getOfflineSigner(chainId);
            const [firstAcc] = await offlineSigner.getAccounts();

            const getTokenInfo = () => {
                return token.isNative ?
                    { "NativeToken": { "denom": token.denom } } :
                    { "Token": { "contract_addr": token.address } }
            }

            const executeMsg = {
                "lock": {
                    "token": {
                        "amount": lockAmount,
                        "info": getTokenInfo()
                    },
                    "release_checkpoints": [{
                        "claimed": false,
                        "release_timestamp": lockUntil,
                        "tokens_count": lockAmount
                    }]
                }
            };

            let contractAllowance = {
                "increase_allowance": {
                    "amount": lockAmount,
                    "spender": ENV.lockerContract
                }
            }

            let allowanceMsg = {
                typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
                value: {
                    sender: firstAcc.address,
                    contract: token.address,
                    msg: Buffer.from(JSON.stringify(contractAllowance))
                }
            };

            let execMsg = {
                typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
                value: {
                    sender: firstAcc.address,
                    contract: ENV.lockerContract,
                    msg: Buffer.from(JSON.stringify(executeMsg)),
                    funds: token.isNative ? [{ denom: ENV.denom, amount: lockAmount }] : undefined
                }
            };

            const client = await SigningCosmWasmClient.connectWithSigner(
                ENV.rpc,
                offlineSigner,
                { gasPrice: GasPrice.fromString("0.1" + token.denom) }
            )

            let result = await client.signAndBroadcast(
                firstAcc.address,
                token.isNative ? [execMsg] : [allowanceMsg, execMsg],
                "auto")

            console.log(result)
        }
        catch (e) { console.log(e) }
        
        //post-thunk actions, update data
        let state = getState();
        let userAddress = state.networkSlice.userAddress;
        dispatch(getUserLocks({ userAddress }));
        dispatch(getSelectedTokenBalance({
            tokenAddress: token.address,
            userAddress: userAddress,
            isNativeCurrency: token.isNative
        }))
    }
);

export const getSelectedTokenBalance = createAsyncThunk(
    'tokenSelector/getSelectedTokenBalance',
    async ({ tokenAddress, userAddress, isNativeCurrency }) => {
        try {
            const signer = await CosmWasmClient.connect(ENV.rpc);
            if (isNativeCurrency) {
                let balance = await signer.getBalance(userAddress, ENV.denom);
                return balance.amount;

            } else {
                let result = await signer.queryContractSmart(
                    tokenAddress,
                    {
                        balance: { address: userAddress }
                    })
                return result.balance;
            }
        }
        catch (e) { console.log(e) }
    }
);

//todo need refactor. there is no token selection, there's a fetching of total supply
export const selectToken = createAsyncThunk(
    "tokenSelector/selectToken",
    async (token) => {
        if (token.isNative || token.totalSupply) {
            return token;
        }

        try {
            let loadedToken = await loadTokenByContractAddress(token.address);

            return {
                ...token,
                totalSupply: loadedToken.totalSupply
            }
        }
        catch (e) { console.log(e) }
    }
)

export const tokenSelectorSlice = createSlice({
    name: 'tokenSelectorSlice',
    initialState,
    reducers: {
        setTokenAmount: (state, action) => {
            state.amount = action.payload;
        },
        setLockUntil: (state, action) => {
            state.lockUntil = action.payload;
        },
        clearAmount: (state) => {
            state.amount = 0;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(getSelectedTokenBalance.fulfilled, (state, action) => {
                state.balance = action.payload
            })
            .addCase(lockToken.fulfilled, (state, action) => {
                state.isApproveLockLoading = false;
            })
            .addCase(lockToken.pending, (state, action) => {
                state.isApproveLockLoading = true;
            })
            .addCase(lockToken.rejected, (state, action) => {
                state.isApproveLockLoading = false;
            })
            .addCase(selectToken.fulfilled, (state, action) => {
                state.selectedToken = { ...action.payload }
            });
    }
});

export const {
    setTokenAmount,
    setLockUntil,
    setApproved,
    clearAmount
} = tokenSelectorSlice.actions;

export default tokenSelectorSlice.reducer;

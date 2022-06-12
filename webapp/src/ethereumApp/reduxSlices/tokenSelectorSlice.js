import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { erc20Abi } from '../constants';
import { getLockerContract, toBaseUnit } from '../helpers';
import { getWeb3 } from '../web3provider';
import { getUserLocks } from './userLocksSlice';
import structuredClone from '@ungap/structured-clone';
import big from 'big.js';

const checkpointInitialState = {
    id: 1,
    tokensCount: 0,
    releaseTargetTimestamp: 0
};

const initialState = {
    selectedToken: {},
    approvedAmount: 0,
    amount: "0",
    balance: 0,
    lockUntil: 0,
    isApproveLockLoading: false,
    releaseCheckpoints: [{
        ...checkpointInitialState
    }]
};

export const addReleaseCheckpoint = createAsyncThunk(
    'tokenSelector/addReleaseCheckpoint',
    async (_, { getState }) => {
        let state = getState();
        return [
            ...state.tokenSelectorSlice.releaseCheckpoints,
            {
                ...checkpointInitialState,
                id: Math.max(...state.tokenSelectorSlice.releaseCheckpoints.map(x => x.id)) + 1
            }
        ]
    }
);

export const approveToken = createAsyncThunk(
    'tokenSelector/approveToken',
    async (_, { getState }) => {
        try {
            let web3 = await getWeb3();
            let state = getState();
            let locker = state.externalDataSlice.locker;
            let tokenAddress = state.tokenSelectorSlice.selectedToken.address;
            let approveAmount = state.tokenSelectorSlice.selectedToken.totalSupply;
            let tokenContract = new web3.eth.Contract(erc20Abi, tokenAddress);

            await tokenContract
                .methods
                .approve(locker.address, approveAmount)
                .send({ from: window.ethereum.selectedAddress });

            return approveAmount;
        }
        catch (e) { console.log(e) }
    }
);

export const lockToken = createAsyncThunk(
    'tokenSelector/lockToken',
    async (_, { dispatch, getState }) => {
        try {
            let state = getState();
            let web3 = getWeb3();
            let locker = structuredClone(state.externalDataSlice.locker);
            let lockerContract = new web3.eth.Contract(locker.abi, locker.address);
            let checkpoints = structuredClone(state.tokenSelectorSlice.releaseCheckpoints)
                .map(cp => ({ ...cp, tokensCount: toBaseUnit(cp.tokensCount) }));
            console.log(JSON.stringify(checkpoints))
            let selectedToken = state.tokenSelectorSlice.selectedToken;
            let userAddress = state.networkSlice.userAddress;

            if (selectedToken.native) {
                await lockerContract
                    .methods
                    .lockNativeCurrency(checkpoints)
                    .send({
                        from: userAddress,
                        value: checkpoints.reduce((acc, rc) => big(Number(rc.tokensCount)).plus(acc), 0)
                    })
            }
            else {
                await lockerContract
                    .methods
                    .lockERC20(selectedToken.address, checkpoints)
                    .send({ from: userAddress });
            }
            await dispatch(getUserLocks({ userAddress }))
            await dispatch(getSelectedTokenBalance({
                tokenAddress: selectedToken.address,
                userAddress,
                isNativeCurrency: selectedToken.native
            }))
            await dispatch(clearAmount())
        }
        catch (e) { console.log(e) }
    }
);

export const getSelectedTokenBalance = createAsyncThunk(
    'tokenSelector/getSelectedTokenBalance',
    async ({ tokenAddress, userAddress, isNativeCurrency }) => {
        try {
            let web3 = await getWeb3();

            if (isNativeCurrency) {
                let balance = await web3.eth.getBalance(userAddress);
                return balance.toString();
            }
            else {
                let tokenContract = new web3.eth.Contract(erc20Abi, tokenAddress);
                let balance = await tokenContract.methods.balanceOf(userAddress).call();
                return balance;
            }
        }
        catch (e) { console.log(e) }
    }
);

export const getSelectedTokenApproval = createAsyncThunk(
    'tokenSelector/getSelectedTokenApproval',
    async (_, { getState }) => {
        try {
            let state = getState();
            let web3 = await getWeb3();

            let userAddress = state.networkSlice.userAddress;
            let spenderAddress = structuredClone(state.externalDataSlice.locker.address);
            let selectedTokenAddress = state.tokenSelectorSlice.selectedToken.address;
            let selectedTokenContract = new web3.eth.Contract(erc20Abi, selectedTokenAddress);

            let allowance = await selectedTokenContract
                .methods
                .allowance(userAddress, spenderAddress)
                .call();

            return allowance.toString();
        }
        catch (e) { console.log(e) }
    }
);

export const clearApproval = createAsyncThunk(
    'tokenSelector/approveToken',
    async (_, thunkApi) => {
        try {
            let state = thunkApi.getState();

            let web3 = await getWeb3();
            let locker = await getLockerContract();
            let tokenContract = new web3.eth.Contract(erc20Abi, state.tokenSelectorSlice.selectedToken.address);
            let totalSupply = state.tokenSelectorSlice.selectedToken.totalSupply;

            await tokenContract
                .methods
                .approve(locker.address, "0")
                .send({ from: window.ethereum.selectedAddress });

            return totalSupply;
        }
        catch (e) { console.log(e) }
    }
);

export const selectToken = createAsyncThunk(
    "tokenSelector/selectToken",
    async (token) => {
        if (token.native || token.totalSupply)
            return token;

        try {
            let web3 = await getWeb3();
            let selectedTokenContract = new web3.eth.Contract(erc20Abi, token.address);

            let totalSupply = await selectedTokenContract
                .methods
                .totalSupply()
                .call();

            return {
                ...token,
                totalSupply
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
            let { amount, id } = action.payload;
            let index = state.releaseCheckpoints.findIndex(x => x.id === id);
            state.releaseCheckpoints[index].tokensCount = amount;
        },
        setLockUntil: (state, action) => {
            let { time, id } = action.payload;
            let index = state.releaseCheckpoints.findIndex(x => x.id === id);
            state.releaseCheckpoints[index].releaseTargetTimestamp = time;
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
            .addCase(getSelectedTokenApproval.fulfilled, (state, action) => {
                state.approvedAmount = action.payload
            })
            .addCase(approveToken.fulfilled, (state, action) => {
                state.approvedAmount = action.payload;
                state.isApproveLockLoading = false;
            })
            .addCase(approveToken.rejected, (state) => {
                state.isApproveLockLoading = false;
            })
            .addCase(approveToken.pending, (state) => {
                state.isApproveLockLoading = true;
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
            })
            .addCase(addReleaseCheckpoint.fulfilled, (state, action) => {
                state.releaseCheckpoints = [...action.payload]
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

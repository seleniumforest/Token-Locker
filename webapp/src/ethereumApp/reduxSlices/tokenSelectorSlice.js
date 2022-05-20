import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getErc20Abi, getLockerContract } from '../helpers';
import { getWeb3 } from '../web3provider';
import { getUserLocks } from './userLocksSlice';

const initialState = {
    selectedToken: {},
    approvedAmount: 0,
    amount: "0",
    balance: 0,
    lockUntil: 0,
    isApproveLockLoading: false
};

export const approveToken = createAsyncThunk(
    'tokenSelector/approveToken',
    async ({ tokenAddress, approveAmount }) => {
        try {
            let web3 = await getWeb3();
            let locker = await getLockerContract();
            let tokenContract = new web3.eth.Contract(await getErc20Abi(), tokenAddress);

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
    async ({ isNative, lockUntil, amount, tokenAddress, userAddress }, { dispatch }) => {
        try {
            let web3 = await getWeb3();
            let locker = await getLockerContract();
            let lockerContract = new web3.eth.Contract(locker.abi, locker.address);

            if (isNative) {
                await lockerContract
                    .methods
                    .lockNativeCurrency(lockUntil.toString())
                    .send({
                        from: userAddress,
                        value: amount
                    })
            }
            else {
                await lockerContract
                    .methods
                    .lock(lockUntil.toString(), tokenAddress, amount)
                    .send({ from: userAddress })
            }
            await dispatch(getUserLocks({ userAddress }))
            await dispatch(getSelectedTokenBalance({
                tokenAddress,
                userAddress,
                isNativeCurrency: isNative
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
                let tokenContract = new web3.eth.Contract(await getErc20Abi(), tokenAddress);
                let balance = await tokenContract.methods.balanceOf(userAddress).call();
                return balance;
            }
        }
        catch (e) { console.log(e) }
    }
);

export const getSelectedTokenApproval = createAsyncThunk(
    'tokenSelector/getSelectedTokenApproval',
    async ({ spenderAddress, userAddress, selectedTokenAddress }) => {
        try {
            let web3 = await getWeb3();
            let selectedTokenContract = new web3.eth.Contract(await getErc20Abi(), selectedTokenAddress);

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
            let tokenContract = new web3.eth.Contract(await getErc20Abi(), state.tokenSelectorSlice.selectedToken.address);
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

        let web3 = await getWeb3();
        
        if (token.native || token.totalSupply) {
            return token;
        } else {
            try {
                let selectedTokenContract = new web3.eth.Contract(await getErc20Abi(), token.address);

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

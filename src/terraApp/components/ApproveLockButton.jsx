import { Coins, Fee, MsgExecuteContract } from '@terra-money/terra.js';
import { useConnectedWallet } from '@terra-money/wallet-provider';
import axios from 'axios';
import big from 'big.js';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { LOCKER_CONTRACT } from '../constants';
import { pollTx } from '../helpers';
import { getUserLocks } from '../reduxSlices/userLocksSlice';
import LoadingSpinner from './LoadingSpinner';

const ApproveLockButton = () => {
    const { tokenSelectorSlice, networkSlice } = useSelector(state => state);
    const dispatch = useDispatch();
    const connectedWallet = useConnectedWallet();

    if (!networkSlice.userAddress)
        return null;

    if (tokenSelectorSlice.isApproveLockLoading)
        return (<LoadingSpinner />)

    let disabled = !tokenSelectorSlice.amount ||
        !tokenSelectorSlice.lockUntil ? "disabled" : "";

    return (
        <button
            className={"big-button"}
            disabled={disabled}
            onClick={async () => {
                let lockAmount = big(tokenSelectorSlice.amount).mul(Math.pow(10, 6)).toString();

                const executeMsg = {
                    "lock": {
                        "token": {
                            "amount": lockAmount
                        },
                        "release_checkpoints": [{
                            "claimed": false,
                            "release_timestamp": tokenSelectorSlice.lockUntil,
                            "tokens_count": lockAmount
                        }]
                    }
                };

                let token = tokenSelectorSlice.selectedToken;
                if (token.native) {
                    executeMsg.lock.token.info = {
                        "NativeToken": {
                            "denom": token.denom
                        }
                    }
                } else {
                    executeMsg.lock.token.info = {
                        "Token": {
                            "contract_addr": token.address
                        }
                    }
                }

                let msgs = [];

                if (!token.native) {
                    msgs.push(new MsgExecuteContract(connectedWallet.walletAddress,
                        token.address,
                        {
                            "increase_allowance": {
                                "amount": lockAmount,
                                "spender": LOCKER_CONTRACT
                            }
                        }));
                }

                msgs.push(new MsgExecuteContract(connectedWallet.walletAddress,
                    LOCKER_CONTRACT,
                    executeMsg,
                    token.native ? new Coins({ [token.denom]: lockAmount }) : undefined));

                const transactionMsg = {
                    fee: new Fee(2000000, '200000uluna'),
                    msgs: msgs
                };
                try {
                    const tx = await connectedWallet.post(transactionMsg);
                    console.log("https://finder.terra.money/localterra/tx/" + tx.result.txhash);
                    await pollTx(tx.result.txhash);
                }
                catch (e) {
                    console.log(e);
                }

                //lcdclient.wasm.query() inside
                dispatch(getUserLocks({ userAddress: networkSlice.userAddress }));
            }}>
            Lock
        </button>
    )
};

export default ApproveLockButton;
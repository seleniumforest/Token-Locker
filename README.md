# Token Locker MVP

Tool to lock your tokens for a given period.

## Run this project

Edit /ethereum/private.json and paste your seed and infura secret key

Run `yarn install && yarn start` at repo root to compile and run frontend.

Run `cd /ethereum && truffle compile && truffle migrate` to compile and deploy scripts to ganache

Or `truffle migrate --network ropsten`  to deploy scripts to ropsten

Truffle compiles and copies artifacts at /public/contracts to access them from react-app

To deploy cosmwasm, see terra docs and cosmwasm/environment/commands.txt

# TODO 

-[done] ethereum contracts
-[done] ethereum contracts tests
-[part.done] ethereum webapp
-[part.done] token lists for eth blockchain
-[wip] feature: allow user to create vested vaults for another user
-[wip] deploy to ropsten
-[wip] cosmwasm contracts
-[wip] juno webapp
-[soon] create locks with by-block release
-[research] integrations with compound/aave to get yield while tokens are locked

## User Guide

1. Switch network to Ropsten in Metamask
2. Claim test ETH faucet from https://faucet.ropsten.be/ or https://faucet.metamask.io/ or https://faucet.dimensions.network/
3. Swap ETH to any token on Uniswap (Ropsten)  
4. Select token in app, enter amount (less than your balance) and choose FUTURE date to lock until. 

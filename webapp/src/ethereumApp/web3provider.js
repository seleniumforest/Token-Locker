import Web3 from 'web3';

let web3Initialized = false;

export const getWeb3 = async () => {
    if (!web3Initialized) {
        window.web3 = new Web3(window.ethereum);
        web3Initialized = true;
    }

    return window.web3;
}
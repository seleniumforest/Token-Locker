const HDWalletProvider = require("@truffle/hdwallet-provider");
const mnemonic = require("./private.json").mnemonic;
const endpoints = require("./private.json").endpoints;

module.exports = {
    //uncomment this for building and moving binaries to /webapp/public
    //tests aren't work for some reason with this param
    contracts_build_directory: "../webapp/public/contracts/",
    networks: {
        dev: {
            host: "127.0.0.1",
            port: 7545,
            network_id: "*",
            provider: function () {
                return new HDWalletProvider(mnemonic, "http://0.0.0.0:7545")
            }
        },
        dev2: {
            host: "127.0.0.1",
            port: 8545,
            network_id: "*"
        },
        ropsten: {
            provider: function () {
                return new HDWalletProvider(mnemonic, endpoints.ropsten)
            },
            network_id: 3,
            gas: 1500000
        }
    },
    compilers: {
        solc: {
            version: '0.8.1'
        }
    }
};

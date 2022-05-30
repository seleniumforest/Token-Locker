import { MsgExecuteContractEncodeObject, SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { stringToPath } from "@cosmjs/crypto";
import { Decimal } from "@cosmjs/math";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { assertIsDeliverTxSuccess } from "@cosmjs/stargate";
import { parseRawLog } from "@cosmjs/stargate/build/logs";

const fs = require('fs').promises;
const mnemonic = "clip hire initial neck maid actor venue " +
    "client foam budget lock catalog sweet steak " +
    "waste crater broccoli pipe steak sister " +
    "coyote moment obvious choose";

//npx ts-node locker_lock_native.ts count timestamp
//npx ts-node locker_lock_native.ts 100000 1652908595 
const main = async () => {
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(
        mnemonic,
        {
            hdPaths: [stringToPath("m/44'/118'/0'/0/0")],
            prefix: "juno"
        }
    );

    const signer = await SigningCosmWasmClient.connectWithSigner(
        "http://localhost:26657",
        wallet,
        {
            gasPrice: { amount: Decimal.fromUserInput("0.1", 1), denom: "ujunox" }
        }
    );

    let senderAddress: string = (await wallet.getAccounts())[0].address;
    var args = process.argv.slice(2);

    let msg = {
        "lock": {
            "token": {
                "amount": args[1],
                "info": {
                    "NativeToken": {
                        "denom": "ujunox"
                    }
                }
            },
            "release_checkpoints": [{
                "claimed": false,
                "release_timestamp": parseInt(args[2]),
                "tokens_count": args[1]
            }]
        }
    }

    let execMsg: MsgExecuteContractEncodeObject = {
        typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
        value: {
            sender: (await wallet.getAccounts())[0].address,
            contract: args[0],
            msg: Buffer.from(JSON.stringify(msg)),
            funds: [
                {
                    denom: "ujunox",
                    amount: args[1]
                }
            ]
        }
    }

    let result = await signer.signAndBroadcast(senderAddress, [execMsg], "auto");
    assertIsDeliverTxSuccess(result);

    let log = parseRawLog(result.rawLog);
    return log[0]
        .events
        .find(x => x.type === "wasm")?.attributes
        .find(x => x.key === "deposit_successful")?.value;
}

main().then(console.log);
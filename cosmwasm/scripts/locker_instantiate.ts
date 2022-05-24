import { MsgInstantiateContractEncodeObject, MsgStoreCodeEncodeObject, SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { stringToPath } from "@cosmjs/crypto";
import { Decimal } from "@cosmjs/math";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { assertIsDeliverTxSuccess } from "@cosmjs/stargate";
import { parseRawLog } from "@cosmjs/stargate/build/logs";
import Long from "long";

const fs = require('fs').promises;
const mnemonic = "clip hire initial neck maid actor venue " +
    "client foam budget lock catalog sweet steak " +
    "waste crater broccoli pipe steak sister " +
    "coyote moment obvious choose";

//npx ts-node locker-instantiate.ts 1
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
    
    let instMsg: MsgInstantiateContractEncodeObject = {
        typeUrl: "/cosmwasm.wasm.v1.MsgInstantiateContract",
        value: {
            sender: (await wallet.getAccounts())[0].address,
            codeId: Long.fromString(args[0] || "-1"),
            msg: Buffer.from("{}"),
            label: "Locker"
        }
    }

    let result = await signer.signAndBroadcast(senderAddress, [ instMsg ], "auto");
    assertIsDeliverTxSuccess(result);

    let log = parseRawLog(result.rawLog);
    return log[0]
        .events
        .find(x => x.type === "instantiate")?.attributes
        .find(x => x.key === "_contract_address")?.value;
}

main().then(console.log);
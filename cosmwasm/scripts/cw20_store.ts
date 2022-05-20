import { MsgStoreCodeEncodeObject, SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
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

    let contractBase64 = await fs.readFile('./cw20_base-aarch64.wasm', { encoding: 'base64' });

    let senderAddress: string = (await wallet.getAccounts())[0].address;
    let storeMsg: MsgStoreCodeEncodeObject = {
        typeUrl: "/cosmwasm.wasm.v1.MsgStoreCode",
        value: {
            sender: (await wallet.getAccounts())[0].address,
            wasmByteCode: contractBase64
        }
    }

    let result = await signer.signAndBroadcast(senderAddress, [ storeMsg ], "auto");
    assertIsDeliverTxSuccess(result);

    let log = parseRawLog(result.rawLog);
    return log[0]
            .events
            .find(x => x.type === "store_code")?.attributes
            .find(x => x.key === "code_id")?.value;
}

main().then(console.log);
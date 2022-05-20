import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { assertIsDeliverTxSuccess } from "@cosmjs/stargate";

const fs = require('fs').promises;
const mnemonic = "clip hire initial neck maid actor venue " +
    "client foam budget lock catalog sweet steak " +
    "waste crater broccoli pipe steak sister " +
    "coyote moment obvious choose";

//npx ts-node cw20_instantiate.ts contract user_address    
//npx ts-node cw20_query_balance.ts juno14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9skjuwg8 juno16g2rahf5846rxzp3fwlswy08fz8ccuwk03k57y
const main = async () => {
    const signer = await CosmWasmClient.connect(
        "http://localhost:26657"
    );

    let args = process.argv.slice(2);

    let result = await signer.queryContractSmart(
        args[0],
        {
            balance: { address: args[1] }
        })
    assertIsDeliverTxSuccess(result);
    console.log(result);
}

main().then(console.log);
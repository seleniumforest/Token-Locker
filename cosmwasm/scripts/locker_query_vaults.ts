import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { assertIsDeliverTxSuccess } from "@cosmjs/stargate";

//npx ts-node locker_query_vaults.ts contract user_address    
//npx ts-node cw20_query_balance.ts juno14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9skjuwg8 juno16g2rahf5846rxzp3fwlswy08fz8ccuwk03k57y
const main = async () => {
    const signer = await CosmWasmClient.connect("http://localhost:26657");

    let args = process.argv.slice(2);

    let result = await signer.queryContractSmart(
        args[0],
        {
            get_user_vaults: { user_address: args[1] }
        })
    assertIsDeliverTxSuccess(result);
    return JSON.stringify(result, null, 2);
}

main().then(console.log);
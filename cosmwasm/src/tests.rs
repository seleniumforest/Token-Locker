#[cfg(test)]
mod tests {
    use crate::ContractError;
    use crate::contract::{execute, instantiate, query};
    use crate::msg::{ExecuteMsg, InstantiateMsg, QueryMsg, UserLocksResponse};
    use crate::state::{AssetInfo, ReleaseCheckpoint};

    use chrono::Utc;
    use cosmwasm_std::testing::{mock_dependencies, mock_env, mock_info, MOCK_CONTRACT_ADDR};
    use cosmwasm_std::{
        coins, from_binary, Addr, BankMsg, Coin, CosmosMsg, SubMsg, Uint128, Timestamp,
    };

    #[test]
    fn proper_initialization() {
        let mut deps = mock_dependencies();
        let msg = InstantiateMsg {};
        let info = mock_info("creator", &coins(1000000, "ujunox"));
        let res = instantiate(deps.as_mut(), mock_env(), info, msg).unwrap();

        assert_eq!(0, res.messages.len());
    }

    #[test]
    fn lock_and_release_token() {
        //init contract
        let mut deps = mock_dependencies();
        let info = mock_info("sender", &[]);
        let res = instantiate(deps.as_mut(), mock_env(), info, InstantiateMsg {}).unwrap();
        assert_eq!(0, res.messages.len());

        let info = mock_info("sender", &[]);

        //execute
        let msg = ExecuteMsg::Lock {
            release_checkpoints: Vec::from([
                ReleaseCheckpoint {
                    id: 2,
                    release_timestamp: Utc::now().timestamp() - 1,
                    tokens_count: Uint128::from(123123 as u32),
                    claimed: false,
                },
                ReleaseCheckpoint {
                    id: -1,
                    release_timestamp: Utc::now().timestamp() - 1,
                    tokens_count: Uint128::from(123123 as u32),
                    claimed: false,
                },
            ]),
            asset_info: AssetInfo::Token {
                contract_addr: Addr::unchecked(MOCK_CONTRACT_ADDR),
            },
        };
        execute(deps.as_mut(), mock_env(), info.clone(), msg.clone()).unwrap();

        let res = query(
            deps.as_ref(),
            mock_env(),
            QueryMsg::GetUserVaults {
                user_address: Addr::unchecked("sender"),
            },
        )
        .unwrap();
        let value: UserLocksResponse = from_binary(&res).unwrap();
        //assert, is userlock created
        assert_eq!(1, value.locks.len());
        //incoming checkpoint ids should be ignored
        assert_eq!(1, value.locks[0].release_checkpoints[0].id);
        assert_eq!(2, value.locks[0].release_checkpoints[1].id);

        //check token info
        assert_eq!(
            AssetInfo::Token {
                contract_addr: Addr::unchecked(MOCK_CONTRACT_ADDR)
            },
            value.locks[0].asset_info
        );

        //try to release
        let release_result = execute(
            deps.as_mut(),
            mock_env(),
            mock_info("sender", &[]),
            ExecuteMsg::ReleaseByVaultId {
                vault_id: 0,
                checkpoint_ids: vec![1],
            },
        )
        .unwrap();

        //print!("${:?} \n", release_result);
        let transfer_msg: Vec<&SubMsg> = release_result
            .messages
            .iter()
            .filter(|x| {
                match x.msg {
                    CosmosMsg::Wasm(_) => return true,
                    _ => return false,
                };
            })
            .collect();
        assert_eq!(1, transfer_msg.iter().count());

        let state_afer_release = query(
            deps.as_ref(),
            mock_env(),
            QueryMsg::GetUserVaults {
                user_address: Addr::unchecked("sender"),
            },
        )
        .unwrap();

        let result_value: UserLocksResponse = from_binary(&state_afer_release).unwrap();
        //check, is flag changed
        assert_eq!(true, result_value.locks[0].release_checkpoints[0].claimed);
        assert_eq!(false, result_value.locks[0].release_checkpoints[1].claimed);
    }

    #[test]
    fn lock_and_release_denom() {
        //init contract
        let mut deps = mock_dependencies();
        let instantiate_info = mock_info("sender", &[]);

        let res = instantiate(
            deps.as_mut(),
            mock_env(),
            instantiate_info,
            InstantiateMsg {},
        )
        .unwrap();
        assert_eq!(0, res.messages.len());

        let execute_info = mock_info("sender", &coins(1000, "ujunox"));

        let msg = ExecuteMsg::Lock {
            release_checkpoints: Vec::from([
                ReleaseCheckpoint {
                    id: 0,
                    release_timestamp: Utc::now().timestamp(),
                    tokens_count: Uint128::from(500 as u32),
                    claimed: false,
                },
                ReleaseCheckpoint {
                    id: 1,
                    release_timestamp: Utc::now().timestamp(),
                    tokens_count: Uint128::from(500 as u32),
                    claimed: false,
                },
            ]),
            asset_info: AssetInfo::NativeToken {
                denom: "ujunox".to_string(),
            },
        };
        execute(deps.as_mut(), mock_env(), execute_info.clone(), msg.clone()).unwrap();

        let query_result = query(
            deps.as_ref(),
            mock_env(),
            QueryMsg::GetUserVaults {
                user_address: Addr::unchecked("sender"),
            },
        )
        .unwrap();

        let value: UserLocksResponse = from_binary(&query_result).unwrap();
        assert_eq!(1, value.locks.len());
        assert_eq!(1, value.locks[0].release_checkpoints[0].id);
        assert_eq!(2, value.locks[0].release_checkpoints[1].id);
        assert_eq!(
            AssetInfo::NativeToken {
                denom: "ujunox".to_string()
            },
            value.locks[0].asset_info
        );

        //try to release
        let release_result = execute(
            deps.as_mut(),
            mock_env(),
            mock_info("sender", &[]),
            ExecuteMsg::ReleaseByVaultId {
                vault_id: 0,
                checkpoint_ids: vec![1],
            },
        )
        .unwrap();

        let transfer_msg: Vec<&SubMsg> = release_result
            .messages
            .iter()
            .filter(|x| {
                match x.msg {
                    CosmosMsg::Bank(_) => return true,
                    _ => return false,
                };
            })
            .collect();
        assert_eq!(
            CosmosMsg::Bank(BankMsg::Send {
                to_address: "sender".to_string(),
                amount: vec![Coin {
                    denom: "ujunox".to_string(),
                    amount: Uint128::from(500 as u32)
                }]
            }),
            transfer_msg[0].msg
        );
        let state_afer_release = query(
            deps.as_ref(),
            mock_env(),
            QueryMsg::GetUserVaults {
                user_address: Addr::unchecked("sender"),
            },
        )
        .unwrap();

        let result_value: UserLocksResponse = from_binary(&state_afer_release).unwrap();
        //check, is flag changed
        assert_eq!(true, result_value.locks[0].release_checkpoints[0].claimed);
        assert_eq!(false, result_value.locks[0].release_checkpoints[1].claimed);
    }

    #[test]
    fn try_release_before_unlock() {
        //init contract
        let mut deps = mock_dependencies();
        let instantiate_info = mock_info("sender", &[]);

        let res = instantiate(
            deps.as_mut(),
            mock_env(),
            instantiate_info,
            InstantiateMsg {},
        )
        .unwrap();
        assert_eq!(0, res.messages.len());

        let execute_info = mock_info("sender", &coins(500, "ujunox"));

        let msg = ExecuteMsg::Lock {
            release_checkpoints: Vec::from([
                ReleaseCheckpoint {
                    id: 0,
                    release_timestamp: 1653769798,
                    tokens_count: Uint128::from(500 as u32),
                    claimed: false,
                },
            ]),
            asset_info: AssetInfo::NativeToken {
                denom: "ujunox".to_string(),
            },
        };
        execute(deps.as_mut(), mock_env(), execute_info.clone(), msg.clone()).unwrap();
        //try to release

        let mut block_env_now = mock_env();
        block_env_now.block.time = Timestamp::from_seconds(1653769796);

        let release_result = execute(
            deps.as_mut(),
            block_env_now.clone(),
            mock_info("sender", &[]),
            ExecuteMsg::ReleaseByVaultId {
                vault_id: 0,
                checkpoint_ids: vec![1],
            },
        );
        println!("{:?} \n", release_result);
        let release_result1 = execute(
            deps.as_mut(),
            block_env_now.clone(),
            mock_info("sender", &[]),
            ExecuteMsg::ReleaseByVaultId {
                vault_id: 2,
                checkpoint_ids: vec![1],
            },
        );
        println!("{:?}", release_result1);
        // assert_eq!(
        //     ContractError::NotTimeForClaim {  },
        //     release_result
        // )
    }
}


use std::iter::FromIterator;

#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{
    to_binary, Addr, BankMsg, Binary, Coin, CosmosMsg, Deps, DepsMut, Env, MessageInfo, Response,
    StdResult, Storage, Timestamp, Uint128, Uint256, WasmMsg,
};
use cw2::set_contract_version;
use cw20::Cw20ExecuteMsg;
use schemars::_serde_json::de::Read;
use schemars::schema::NumberValidation;

use crate::error::ContractError;
use crate::msg::{ExecuteMsg, InstantiateMsg, QueryMsg, UserLocksResponse};
use crate::state::{Asset, AssetInfo, ReleaseCheckpoint, TokenVault, STATE};

// version info for migration info
const CONTRACT_NAME: &str = "crates.io:token-locker";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;

    Ok(Response::new()
        .add_attribute("method", "instantiate")
        .add_attribute("owner", info.sender))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::Lock {
            release_checkpoints,
            token,
        } => try_lock(deps, _env, info, release_checkpoints, token),
        ExecuteMsg::ReleaseByVaultId { vault_id } => {
            try_release_vault(deps, _env, info, msg, vault_id)
        }
        ExecuteMsg::ReleaseAllAvailable {} => try_release_all(deps),
    }
}

pub fn try_lock(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    release_checkpoints: Vec<ReleaseCheckpoint>,
    token: Asset,
) -> Result<Response, ContractError> {
    let locks = STATE.may_load(deps.storage, &info.sender).unwrap();

    let new_vault = TokenVault {
        asset: token.clone(),
        id: match locks.clone() {
            None => 0,
            Some(locks_vec) => locks_vec.iter().max_by_key(|p| p.id).unwrap().id + 1,
        },
        release_checkpoints: release_checkpoints,
    };

    STATE.update(
        deps.storage,
        &info.sender,
        |_state| -> Result<_, ContractError> {
            match locks {
                None => Ok(vec![new_vault.clone()]),
                Some(mut locksVec) => {
                    locksVec.push(new_vault.clone());
                    Ok(locksVec)
                }
            }
        },
    )?;

    let mut response = Response::new()
        .add_attribute("method", "lock")
        .add_attribute("id", new_vault.clone().id.to_string());

    match new_vault.asset.info {
        AssetInfo::Token { contract_addr } => {
            response = response.add_message(CosmosMsg::Wasm(WasmMsg::Execute {
                contract_addr: contract_addr.to_string(),
                funds: vec![],
                msg: to_binary(&Cw20ExecuteMsg::TransferFrom {
                    amount: new_vault.asset.amount,
                    owner: info.sender.to_string(),
                    recipient: env.contract.address.to_string(),
                })?,
            }));
        }
        AssetInfo::NativeToken { denom } => {
            let deposit_amount: Uint128 = info
                .funds
                .iter()
                .find(|x| x.denom == denom)
                .map(|x| Uint128::from(x.amount))
                .unwrap_or_else(Uint128::zero);

            if (deposit_amount != new_vault.asset.amount) {
                return Err(ContractError::MyError {});
            }

            response = response.add_attribute("lock deposit_amount", deposit_amount)
        }
    }

    Ok(response)
}

pub fn try_release_vault(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
    vault_id: i32,
) -> Result<Response, ContractError> {
    let mut state = STATE.may_load(deps.storage, &info.sender)?;

    let vault = match &state {
        Some(vaults) => vaults.iter().find(|x| x.id == vault_id),
        None => return Err(ContractError::Mock {}),
    };

    let mut response: Response = Response::new()
        .add_attribute("method", "lock")
        .add_attribute("id", vault_id.clone().to_string());

    match vault {
        Some(v) => {
            if (v.release_checkpoints[0].claimed == true) {
                return Err(ContractError::AlreadyClaimed {});
            };

            if (v.release_checkpoints[0].release_timestamp > _env.block.time.seconds() as i64) {
                return Err(ContractError::NotTimeForClaim {});
            }

            STATE.update(
                deps.storage,
                &info.sender,
                |state| -> Result<_, ContractError> {
                    match state {
                        None => Err(ContractError::MyError {}),
                        Some(mut locksVec) => {
                            locksVec
                                .iter_mut()
                                .find(|x| x.id == vault_id)
                                .unwrap()
                                .release_checkpoints[0]
                                .claimed = true;
                            Ok(locksVec)
                        }
                    }
                },
            )?;

            match &v.asset.info {
                AssetInfo::Token { contract_addr } => {
                    response = response.add_message(CosmosMsg::Wasm(WasmMsg::Execute {
                        contract_addr: contract_addr.to_string(),
                        funds: vec![],
                        msg: to_binary(&Cw20ExecuteMsg::Transfer {
                            amount: v.release_checkpoints[0].tokens_count,
                            recipient: info.sender.to_string(),
                        })?,
                    }));
                }
                AssetInfo::NativeToken { denom } => {
                    response = response.add_message(CosmosMsg::Bank(BankMsg::Send {
                        to_address: info.sender.to_string(),
                        amount: vec![Coin {
                            denom: denom.to_string(),
                            amount: v.release_checkpoints[0].tokens_count,
                        }],
                    }));
                }
            }
        }
        None => return Err(ContractError::MyError {}),
    }

    return Ok(response);
}

pub fn try_release_all(deps: DepsMut) -> Result<Response, ContractError> {
    return Err(ContractError::Mock {});
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetUserVaults { user_address } => {
            to_binary(&get_user_vaults(deps, user_address)?)
        }
    }
}

fn get_user_vaults(deps: Deps, user_address: Addr) -> StdResult<UserLocksResponse> {
    let state = STATE.may_load(deps.storage, &user_address)?;

    return Ok(UserLocksResponse {
        locks: match state {
            None => vec![],
            Some(userlocks) => userlocks,
        },
    });
}

#[cfg(test)]
mod tests {
    use super::*;
    use cosmwasm_std::testing::{mock_dependencies, mock_env, mock_info};
    use cosmwasm_std::{coins, from_binary};

    #[test]
    fn proper_initialization() {
        let mut deps = mock_dependencies(&[]);

        let msg = InstantiateMsg {};
        let info = mock_info("creator", &coins(1000, "earth"));

        // we can just call .unwrap() to assert this was a success
        let res = instantiate(deps.as_mut(), mock_env(), info, msg).unwrap();
        assert_eq!(0, res.messages.len());
    }

    #[test]
    fn lock() {
        let mut deps = mock_dependencies(&[]);

        let msg = InstantiateMsg {};
        let info = mock_info("creator", &coins(1000, "earth"));

        let res = instantiate(deps.as_mut(), mock_env(), info, msg).unwrap();
        assert_eq!(0, res.messages.len());

        let info = mock_info(
            "terra1x46rqay4d3cssq8gxxvqz8xt6nwlz4td20k38v",
            &coins(200000, "uluna"),
        );
        let msg = ExecuteMsg::Lock {
            release_checkpoints: Vec::from([ReleaseCheckpoint {
                release_timestamp: 123123333,
                tokens_count: Uint128::from(123123 as u32),
                claimed: false,
            }]),
            token: Asset {
                info: AssetInfo::Token {
                    contract_addr: Addr::unchecked("terra1x46rqay4d3cssq8gxxvqz8xt6nwlz4td20k38v"),
                },
                amount: Uint128::from(123123 as u32),
            },
        };
        let _res1 = execute(deps.as_mut(), mock_env(), info.clone(), msg.clone()).unwrap();
        let _res2 = execute(deps.as_mut(), mock_env(), info, msg).unwrap();

        let res = query(
            deps.as_ref(),
            mock_env(),
            QueryMsg::GetUserVaults {
                user_address: Addr::unchecked("terra1x46rqay4d3cssq8gxxvqz8xt6nwlz4td20k38v"),
            },
        )
        .unwrap();

        let value: UserLocksResponse = from_binary(&res).unwrap();
        assert_eq!(2, value.locks.len());
        assert_eq!(0, value.locks[0].id);
        assert_eq!(1, value.locks[1].id);
        assert_eq!(
            AssetInfo::Token {
                contract_addr: Addr::unchecked("terra1x46rqay4d3cssq8gxxvqz8xt6nwlz4td20k38v")
            },
            value.locks[0].asset.info
        );
        assert_eq!(
            123123333,
            value.locks[0].release_checkpoints[0].release_timestamp
        );
    }
}

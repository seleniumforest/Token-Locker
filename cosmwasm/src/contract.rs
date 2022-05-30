#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{
    to_binary, Addr, BankMsg, Binary, Coin, CosmosMsg, Deps, DepsMut, Env, MessageInfo, Response,
    StdResult, Uint128, WasmMsg,
};
use cw2::set_contract_version;
use cw20::Cw20ExecuteMsg;

use crate::error::ContractError;
use crate::msg::{ExecuteMsg, InstantiateMsg, QueryMsg, UserLocksResponse};
use crate::state::{AssetInfo, ReleaseCheckpoint, TokenVault, STATE};

// version info for migration info
const CONTRACT_NAME: &str = "crates.io:token-locker";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    _msg: InstantiateMsg,
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
            asset_info,
        } => try_lock(deps, _env, info, release_checkpoints, asset_info),
        ExecuteMsg::ReleaseByVaultId {
            vault_id,
            checkpoint_ids,
        } => try_release_vault(deps, _env, info, vault_id, checkpoint_ids),
    }
}

pub fn try_lock(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    release_checkpoints: Vec<ReleaseCheckpoint>,
    asset_info: AssetInfo,
) -> Result<Response, ContractError> {
    let locks = STATE.may_load(deps.storage, &info.sender).unwrap();

    let mut id_iter: i32 = 0;
    let new_vault = TokenVault {
        asset_info: asset_info.clone(),
        id: match locks.clone() {
            None => 0,
            Some(locks_vec) => locks_vec.iter().max_by_key(|p| p.id).unwrap().id + 1,
        },
        release_checkpoints: release_checkpoints
            .iter()
            .map(|x| {
                id_iter += 1;
                return ReleaseCheckpoint {
                    id: id_iter,
                    tokens_count: x.tokens_count,
                    release_timestamp: x.release_timestamp,
                    claimed: false,
                };
            })
            .collect(),
    };

    STATE.update(
        deps.storage,
        &info.sender,
        |_state| -> Result<_, ContractError> {
            match locks {
                None => Ok(vec![new_vault.clone()]),
                Some(mut locks_vec) => {
                    locks_vec.push(new_vault.clone());
                    Ok(locks_vec)
                }
            }
        },
    )?;

    let mut response = Response::new()
        .add_attribute("method", "lock")
        .add_attribute("id", new_vault.clone().id.to_string());

    let requested_amount: Uint128 = release_checkpoints.iter().map(|x| x.tokens_count).sum();

    match new_vault.asset_info {
        AssetInfo::Token { contract_addr } => {
            response = response.add_message(CosmosMsg::Wasm(WasmMsg::Execute {
                contract_addr: contract_addr.to_string(),
                funds: vec![],
                msg: to_binary(&Cw20ExecuteMsg::TransferFrom {
                    amount: requested_amount,
                    owner: info.sender.to_string(),
                    recipient: env.contract.address.to_string(),
                })?,
            }));
        }
        AssetInfo::NativeToken { denom } => {
            let deposited_amount: Uint128 = info
                .funds
                .iter()
                .find(|x| x.denom == denom)
                .map(|x| Uint128::from(x.amount))
                .unwrap_or_else(Uint128::zero);

            if deposited_amount != requested_amount {
                return Err(ContractError::CustomError {
                    val: "Deposited amount != requested amount".to_string(),
                });
            }

            response = response.add_attribute("deposit_successful", deposited_amount);
        }
    }

    Ok(response)
}

pub fn try_release_vault(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    vault_id: i32,
    checkpoint_ids: Vec<i32>,
) -> Result<Response, ContractError> {
    let state = STATE.may_load(deps.storage, &info.sender)?;

    let vault = match &state {
        Some(vaults) => vaults.iter().find(|x| x.id == vault_id),
        None => return Err(ContractError::Mock {}),
    };

    let mut response: Response = Response::new()
        .add_attribute("method", "lock")
        .add_attribute("id", vault_id.clone().to_string());

    if let Some(v) = vault {
        let mut amount_to_release = Uint128::zero();

        let update_action = |state: Option<Vec<TokenVault>>| -> Result<_, ContractError> {
            if let Some(mut locks_vec) = state {
                let vault = locks_vec.iter_mut().find(|x| x.id == vault_id);

                if let Some(mut v) = vault {
                    let mut cps_mut = v.clone().release_checkpoints;
                    cps_mut
                        .iter_mut()
                        .for_each(|x| {
                            if !checkpoint_ids.contains(&x.id){
                                return;
                            }

                            if x.claimed {
                                return Err(ContractError::AlreadyClaimed {});
                            }

                            if x.release_timestamp > _env.block.time.seconds() as i64 {
                                ContractError::NotTimeForClaim {};
                            }

                            amount_to_release += x.tokens_count;
                            x.claimed = true;
                        });
                        
                    locks_vec.iter_mut().find(|x| x.id == vault_id).unwrap().release_checkpoints = cps_mut;
                    return Ok(locks_vec);
                }

                return Err(ContractError::CustomError {
                    val: "".to_string(),
                });
            }

            return Err(ContractError::CustomError {
                val: "".to_string(),
            });
        };

        let result = STATE.update(deps.storage, &info.sender, update_action);
        if result.is_ok() {
            println!("{:?}", result.unwrap());
        }
        else {
            println!("{:?}", result.unwrap_err());
        }
        
        //println!("{:?}", result);

        match &v.asset_info {
            AssetInfo::Token { contract_addr } => {
                response = response.add_message(CosmosMsg::Wasm(WasmMsg::Execute {
                    contract_addr: contract_addr.to_string(),
                    funds: vec![],
                    msg: to_binary(&Cw20ExecuteMsg::Transfer {
                        amount: amount_to_release,
                        recipient: info.sender.to_string(),
                    })?,
                }));
            }
            AssetInfo::NativeToken { denom } => {
                response = response.add_message(CosmosMsg::Bank(BankMsg::Send {
                    to_address: info.sender.to_string(),
                    amount: vec![Coin {
                        denom: denom.to_string(),
                        amount: amount_to_release,
                    }],
                }));
            }
        }
    }

    return Ok(response);
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

use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use cosmwasm_std::{Addr, Uint256};
use cw_storage_plus::{Map};

// #[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
// pub struct State {
//     pub count: i32,
//     pub owner: Addr,
// }

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct ReleaseCheckpoint {
    pub tokens_count: Uint256,
    pub release_timestamp: i64,
    pub claimed: bool
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct TokenVault {
    pub asset: Asset,
    pub id: i32,
    pub release_checkpoints: Vec<ReleaseCheckpoint>
}

//Asset wrappers
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub enum AssetInfo {
    Token { contract_addr: Addr },
    NativeToken { denom: String },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Asset {
    pub info: AssetInfo,
    pub amount: Uint256,
}

pub const STATE: Map<&Addr, Vec<TokenVault>> = Map::new("locks");

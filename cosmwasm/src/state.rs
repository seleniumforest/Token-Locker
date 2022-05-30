use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use cosmwasm_std::{Addr, Uint128};
use cw_storage_plus::{Map};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct ReleaseCheckpoint {
    pub id: i32,
    pub tokens_count: Uint128,
    pub release_timestamp: i64,
    pub claimed: bool
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct TokenVault {
    pub asset_info: AssetInfo,
    pub id: i32,
    pub release_checkpoints: Vec<ReleaseCheckpoint>
}

//Asset wrappers
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub enum AssetInfo {
    Token { contract_addr: Addr },
    NativeToken { denom: String },
}

pub const STATE: Map<&Addr, Vec<TokenVault>> = Map::new("locks");

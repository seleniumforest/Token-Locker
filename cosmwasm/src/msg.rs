use cosmwasm_std::Addr;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use crate::state::{ ReleaseCheckpoint, TokenVault, AssetInfo};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct InstantiateMsg { }

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    Lock { release_checkpoints: Vec<ReleaseCheckpoint>, asset_info: AssetInfo },
    ReleaseByVaultId { vault_id: i32, checkpoint_ids: Vec<i32> }
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    GetUserVaults { user_address: Addr },
}

// We define a custom struct for each query response
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct UserLocksResponse {
    pub locks: Vec<TokenVault>,
}
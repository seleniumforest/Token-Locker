use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Unauthorized")]
    Mock {},

    #[error("Unauthorized")]
    Unauthorized {},

    #[error("MyError")]
    MyError {},

    #[error("AlreadyClaimed")]
    AlreadyClaimed {},

    #[error("NotTimeForClaim")]
    NotTimeForClaim {}
}

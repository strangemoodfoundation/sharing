use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

declare_id!("Hua5xPD28e5ovftEuzmxRwonzYvsNahGyxX8fJs5f1KD");

#[program]
pub mod sharing_protocol {
    use super::*;
    pub fn initialize(ctx: Context<InitSharingAccount>) -> ProgramResult {
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(sharing_bump: u8)]
pub struct InitSharingAccount<'info> {
  #[account(
    init, 
    seeds=[b"sharing", deposit_account.key().as_ref()],
    bump=sharing_bump,
    payer=deposit_account,
    space= 8 // all accounts need 8 bytes for the account discriminator prepended to the account
      + 32 // token_account: Pubkey needs 32 bytes
      + 32 // deposit_account: Pubkey needs 32 bytes
      + 8 // split_percent_amount
      + 1 // split_percent_decimals
  )]
    pub sharing_account: Account<'info, SharingAccount>,

    pub token_account: Account<'info, TokenAccount>,
    pub deposit_account: Account<'info, TokenAccount>,
}

#[account]
pub struct SharingAccount {    
  pub token_account: Pubkey, // escrow; the temp holder of tokens
  pub deposit_account: Pubkey, // where funds are heading

  // Note that Borsh doesn't support floats, and so we carry over the pattern
  // used in the token program of having an "amount" and a "decimals".
  // So an "amount" of 100 and a "decimals" of 3 would be 0.1
  pub split_percent_amount: u64,
  pub split_percent_decimals: u8,
}

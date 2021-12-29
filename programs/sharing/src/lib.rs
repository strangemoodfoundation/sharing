use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

declare_id!("Hua5xPD28e5ovftEuzmxRwonzYvsNahGyxX8fJs5f1KD");

#[program]
pub mod sharing {
  use super::*;
  pub fn init_sharing_account(ctx: Context<InitSharingAccount>, _sharing_bump: u8, split_percent_amount: u64, split_percent_decimals: u8) -> ProgramResult {
    // Check that the sol_deposit is wrapped sol
    let token_account = ctx.accounts.token_account.clone().into_inner();
    if token_account.mint != spl_token::native_mint::ID {
      return Err(SharingProgramError::OnlyWrappedSolIsSupported.into());
    }

    let deposit_account = ctx.accounts.deposit_account.clone().into_inner();
    if deposit_account.mint != spl_token::native_mint::ID {
      return Err(SharingProgramError::OnlyWrappedSolIsSupported.into());
    }

    let sharing_acc = &mut ctx.accounts.sharing_account; // grab a mutable reference to our MemoAccount struct
    sharing_acc.split_percent_amount = split_percent_amount;
    sharing_acc.split_percent_decimals = split_percent_decimals;
    
    sharing_acc.deposit_account = ctx.accounts.deposit_account.key();
    sharing_acc.token_account = ctx.accounts.token_account.key();

      Ok(())
  }

  pub fn update_sharing_account(ctx: Context<UpdateSharingAccount>, split_percent_amount: u64, split_percent_decimals: u8) -> ProgramResult {
    let deposit_account = ctx.accounts.deposit_account.clone().into_inner();
    if deposit_account.mint != spl_token::native_mint::ID {
      return Err(SharingProgramError::OnlyWrappedSolIsSupported.into());
    }
    
    let sharing_acc = &mut ctx.accounts.sharing_account; // grab a mutable reference to our MemoAccount struct
    sharing_acc.split_percent_amount = split_percent_amount;
    sharing_acc.split_percent_decimals = split_percent_decimals;
    
    sharing_acc.deposit_account = ctx.accounts.deposit_account.key();

    // sharing_acc.token_account = ctx.accounts.token_account.key();

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

  pub system_program: Program<'info, System>, // <--- Anchor boilerplate
}

#[derive(Accounts)]
pub struct UpdateSharingAccount<'info> {
  #[account(mut)]
  pub sharing_account: Account<'info, SharingAccount>,
  
  pub deposit_account: Account<'info, TokenAccount>,

  pub system_program: Program<'info, System>, // <--- Anchor boilerplate
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

#[error]
pub enum SharingProgramError {
    #[msg("Only Wrapped Sol Is Supported: Deposit Account and Token Account must be Wrapped SOL")]
    OnlyWrappedSolIsSupported,
}

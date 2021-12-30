use anchor_lang::prelude::*;
use anchor_spl::{
  token::{Mint, Token, TokenAccount},
  associated_token
};

declare_id!("2XTyzP5w7DL5dPD8j2ey7GvJ1FGsVeqmJC9AGwB6xvbb");

pub fn create_associated_token_acct_cpi<'a>(
  payer: AccountInfo<'a>,
  authority: AccountInfo<'a>,
  associated_token: AccountInfo<'a>,
  mint: AccountInfo<'a>,
  system_program: AccountInfo<'a>,
  token_program: AccountInfo<'a>,
  rent: AccountInfo<'a>, // Sysvar<'a, Rent>,

  // for signing -- these match seeds needed for signing the original sharing account
  deposit_account: Pubkey,
  asset_id: Pubkey,
  sharing_bump: u8
) -> Result<Pubkey> {
    let cpi_program = token_program.clone();
    let cpi_accounts = associated_token::Create {
        mint: mint.clone(),
        payer,
        rent,
        system_program,
        token_program,
        associated_token: associated_token,
        authority: authority.clone(),
    };

    let seeds = &[b"sharing", asset_id.as_ref(), deposit_account.as_ref(), &[sharing_bump]];
    let signers = &[&seeds[..]];
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signers);
    anchor_spl::associated_token::create(cpi_ctx)?;

    return Ok(anchor_spl::associated_token::get_associated_token_address(authority.key, mint.key));
}

#[program]
pub mod sharing {
  // use std::task::Context;

use super::*;
  pub fn init_sharing_account(ctx: Context<InitSharingAccount>, sharing_bump: u8, asset_id: Pubkey, split_percent_amount: u64, split_percent_decimals: u8) -> ProgramResult {
    // Check that the sol_deposit is wrapped sol
    let token_account = create_associated_token_acct_cpi(
      ctx.accounts.user.clone().to_account_info(), 
      ctx.accounts.sharing_account.clone().to_account_info(),
      ctx.accounts.token_account_pda.clone().to_account_info(),
      ctx.accounts.mint.clone().to_account_info(),
      ctx.accounts.system_program.clone().to_account_info(),
      ctx.accounts.token_program.clone().to_account_info(),
      ctx.accounts.rent.clone().to_account_info(),
      ctx.accounts.deposit_account.clone().to_account_info().key(),
      asset_id,
      sharing_bump
    )?;

    let deposit_account = ctx.accounts.deposit_account.clone().into_inner();
    if deposit_account.mint != spl_token::native_mint::ID {
      return Err(SharingProgramError::OnlyWrappedSolIsSupported.into());
    }

    let sharing_acc = &mut ctx.accounts.sharing_account; // grab a mutable reference to our MemoAccount struct
    sharing_acc.split_percent_amount = split_percent_amount;
    sharing_acc.split_percent_decimals = split_percent_decimals;
    
    sharing_acc.deposit_account = ctx.accounts.deposit_account.key();
    sharing_acc.token_account = token_account;

    Ok(())
  }

  pub fn update_sharing_account(ctx: Context<UpdateSharingAccount>, split_percent_amount: u64, split_percent_decimals: u8) -> ProgramResult {
    let sharing_acc = &mut ctx.accounts.sharing_account; // grab a mutable reference to our MemoAccount struct
    sharing_acc.split_percent_amount = split_percent_amount;
    sharing_acc.split_percent_decimals = split_percent_decimals;

    Ok(())
  }
}

#[derive(Accounts)]
#[instruction(sharing_bump: u8, asset_id: Pubkey)]
pub struct InitSharingAccount<'info> {
  #[account(
    init, 
    seeds=[b"sharing", asset_id.as_ref(), deposit_account.key().as_ref()],
    bump=sharing_bump,
    payer=user,
    space= 8 // all accounts need 8 bytes for the account discriminator prepended to the account
      + 32 // token_account: Pubkey needs 32 bytes
      + 32 // deposit_account: Pubkey needs 32 bytes
      + 8 // split_percent_amount
      + 1 // split_percent_decimals
  )]
  pub sharing_account: Account<'info, SharingAccount>,

  pub deposit_account: Account<'info, TokenAccount>,

  // These three are needed to programatically create PDAs. 
  pub token_account_pda: AccountInfo<'info>,
  // pub token_account: Account<'info, TokenAccount>, // auto-generated!

  pub associated_token_program: AccountInfo<'info>,
  pub token_program: AccountInfo<'info>,
  pub mint: AccountInfo<'info>,
  pub rent: Sysvar<'info, Rent>,

  pub user: Signer<'info>,
  pub system_program: Program<'info, System>, // <--- Anchor boilerplate
}

#[derive(Accounts)]
pub struct UpdateSharingAccount<'info> {
  #[account(mut)]
  pub sharing_account: Account<'info, SharingAccount>,
  
  // Cannot update deposit acct or token acct. that;s just how it be.
  // pub deposit_account: Account<'info, TokenAccount>,

  pub user: Signer<'info>,
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

use anchor_lang::prelude::*;
use anchor_spl::{token::{TokenAccount}};
use solana_program::{
    system_instruction::{transfer}, 
    program::{invoke},
    entrypoint::ProgramResult
};
declare_id!("sharYRHd1q5fGpwNecudQrgQT9dT9U22U8Fi2K7VC6y");

pub fn execute_transfer<'a>(from: AccountInfo<'a>, to: AccountInfo<'a>, amount: u64) -> ProgramResult {
    let ix = transfer(from.key, to.key, amount);
    invoke(&ix, &[from.clone(), to.clone()])?;
    Ok(())
}

pub(crate) fn amount_as_float(amount: u64, decimals: u8) -> f64 {
    amount as f64 / i32::pow(10, decimals.into()) as f64
}


#[program]
pub mod sharing {
use super::*; 

  pub fn init_sharing_account(ctx: Context<InitSharingAccount>, _sharing_bump: u8, _asset_id: Pubkey, split_percent_amount: u64, split_percent_decimals: u8) -> ProgramResult {
    let sharing_acc = &mut ctx.accounts.sharing_account; // grab a mutable reference to our MemoAccount struct
    sharing_acc.split_percent_amount = split_percent_amount;
    sharing_acc.split_percent_decimals = split_percent_decimals;
    
    sharing_acc.deposit_account = ctx.accounts.deposit_account.key();
    sharing_acc.token_account = ctx.accounts.token_account.key();

    Ok(())
  }

  pub fn set_sharing_account_split_percent(ctx: Context<SetSharingAccountSplitPercent>, split_percent_amount: u64, split_percent_decimals: u8) -> ProgramResult {
    let sharing_acc = &mut ctx.accounts.sharing_account; // grab a mutable reference to our MemoAccount struct
    sharing_acc.split_percent_amount = split_percent_amount;
    sharing_acc.split_percent_decimals = split_percent_decimals;

    Ok(())
  }

  pub fn share_balance(ctx: Context<ShareBalance>) -> ProgramResult {
    let token_acct_balance = ctx.accounts.token_account.amount;

    // NOTE: we add 2 to decimals to turn it from "10%" to "0.1"
    let affiliate_cut = amount_as_float(ctx.accounts.sharing_account.split_percent_amount,ctx.accounts.sharing_account.split_percent_decimals + 2 );

    // let forDepositAcct = 1;
    let acciliate_account_amt_to_transfer = token_acct_balance as f64 * affiliate_cut;
    let deposit_account_amt_to_transfer = token_acct_balance - acciliate_account_amt_to_transfer as u64;
    execute_transfer(ctx.accounts.affiliate_account.to_account_info(), ctx.accounts.deposit_account.to_account_info(), acciliate_account_amt_to_transfer as u64)?;
    execute_transfer(ctx.accounts.token_account.to_account_info(), ctx.accounts.deposit_account.to_account_info(), deposit_account_amt_to_transfer)?;

    Ok(())
  }

  // sends whatever is left back to the OG deposit account, can be called by anyone.
  pub fn recover(ctx: Context<Recover>) -> ProgramResult {
    let token_acct_balance = ctx.accounts.token_account.amount;
    execute_transfer(ctx.accounts.token_account.to_account_info(), ctx.accounts.deposit_account.to_account_info(), token_acct_balance)?;

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

  pub token_account: Account<'info, TokenAccount>,

  pub deposit_account: Account<'info, TokenAccount>,

  pub user: Signer<'info>,
  pub system_program: Program<'info, System>, // <--- Anchor boilerplate
}


#[derive(Accounts)]
pub struct SetSharingAccountSplitPercent<'info> {
  #[account(mut)]
  pub sharing_account: Account<'info, SharingAccount>,

  pub user: Signer<'info>,
  pub system_program: Program<'info, System>, // <--- Anchor boilerplate
}

#[derive(Accounts)]
pub struct ShareBalance<'info> {
  #[account(mut)]
  pub sharing_account: Account<'info, SharingAccount>,
  
  // temporary holder! purchasing a listing moves stuff here, which moves to other places
  #[account(mut)]
  pub token_account: Account<'info, TokenAccount>,

  // owner of the asset / listing / primary holder
  #[account(mut)]
  pub deposit_account: Account<'info, TokenAccount>,

  // receives a portion!
  #[account(mut)]
  pub affiliate_account: Account<'info, TokenAccount>,

  pub user: Signer<'info>,
  pub system_program: Program<'info, System>, // <--- Anchor boilerplate
}

#[derive(Accounts)]
pub struct Recover<'info> {
  #[account(mut)]
  pub sharing_account: Account<'info, SharingAccount>,

  // An escrow
  #[account(mut)]
  pub token_account: Account<'info, TokenAccount>,

  // Where the funds are heading
  #[account(mut)]
  pub deposit_account: Account<'info, TokenAccount>,

  pub user: Signer<'info>,
  pub system_program: Program<'info, System>, // <--- Anchor boilerplate
}


#[account]
pub struct SharingAccount { 
  // escrow; the temp holder of tokens
  pub token_account: Pubkey,

  // where funds are heading
  pub deposit_account: Pubkey,

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

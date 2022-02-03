use anchor_lang::prelude::*;
use anchor_spl::{token::{TokenAccount, Mint, Token}};
use solana_program::{
    entrypoint::ProgramResult
};
declare_id!("sharYRHd1q5fGpwNecudQrgQT9dT9U22U8Fi2K7VC6y");

// Transfer from one token account to another using the Token Program
pub fn token_transfer<'a>(
  token_program: AccountInfo<'a>,
  from: AccountInfo<'a>,
  to: AccountInfo<'a>,
  authority: AccountInfo<'a>,
  bump: u8,
  amount: u64,
) -> ProgramResult {
  let cpi_program = token_program;
  let from_copy = from.key.clone();
  let cpi_accounts = anchor_spl::token::Transfer {
      from,
      to,
      authority,
  };
  let seeds = &[b"authority", from_copy.as_ref(), &[bump]];
  let signers = &[&seeds[..]];
  let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signers);
  anchor_spl::token::transfer(cpi_ctx, amount)
}

pub(crate) fn amount_as_float(amount: u64, decimals: u8) -> f64 {
    amount as f64 / i32::pow(10, decimals.into()) as f64
}

#[program]
pub mod sharing {
use super::*;

  pub fn init_sharing_account(ctx: Context<InitSharingAccount>, _sharing_bump: u8,  _escrow_authority_bump: u8, split_percent_amount: u64, split_percent_decimals: u8) -> ProgramResult {
    let sharing_acc = &mut ctx.accounts.sharing_account; // grab a mutable reference to our MemoAccount struct
    sharing_acc.split_percent_amount = split_percent_amount;
    sharing_acc.split_percent_decimals = split_percent_decimals;
    
    sharing_acc.deposit = ctx.accounts.deposit.key();
    sharing_acc.escrow = ctx.accounts.escrow.key();

    Ok(())
  }

  pub fn set_sharing_account_split_percent(ctx: Context<SetSharingAccountSplitPercent>, split_percent_amount: u64, split_percent_decimals: u8) -> ProgramResult {

    let user = ctx.accounts.user.clone();
    let deposit = ctx.accounts.deposit.clone().into_inner();
    let sharing_acc = &mut ctx.accounts.sharing_account; // grab a mutable reference to our MemoAccount struct

    if deposit.owner != *user.key {
      return Err(SharingError::UserIsNotDepositOwner.into())
    }
    
    sharing_acc.split_percent_amount = split_percent_amount;
    sharing_acc.split_percent_decimals = split_percent_decimals;

    Ok(())
  }

  pub fn share_balance(ctx: Context<ShareBalance>, escrow_authority_bump: u8) -> ProgramResult {
    let token_acct_balance = ctx.accounts.escrow.amount;

    let affiliate_cut = amount_as_float(
      ctx.accounts.sharing.split_percent_amount,
      ctx.accounts.sharing.split_percent_decimals);

    // let forDepositAcct = 1;
    let affiliate_account_amt_to_transfer = (token_acct_balance as f64 * affiliate_cut) as u64;
    let deposit_account_amt_to_transfer = token_acct_balance - affiliate_account_amt_to_transfer;

    // Transfer to the affiliate_account account
    token_transfer(
      ctx.accounts.token_program.to_account_info(), 
      ctx.accounts.escrow.to_account_info(), 
        ctx.accounts.affiliate.to_account_info(),
        ctx.accounts.escrow_authority.to_account_info(),
        escrow_authority_bump,
        affiliate_account_amt_to_transfer 
    )?;

    // Transfer to the deposit account
    token_transfer(
      ctx.accounts.token_program.to_account_info(), 
      ctx.accounts.escrow.to_account_info(), 
      ctx.accounts.deposit.to_account_info(),
      ctx.accounts.escrow_authority.to_account_info(),
      escrow_authority_bump,
      deposit_account_amt_to_transfer
    )?;

    Ok(())
  }

  // sends whatever is left back to the OG deposit account, can be called by anyone.
  pub fn recover(ctx: Context<Recover>, escrow_authority_bump:u8) -> ProgramResult {
    let token_acct_balance = ctx.accounts.escrow.amount;
    token_transfer(
      ctx.accounts.token_program.to_account_info(), 
      ctx.accounts.escrow.to_account_info(), 
      ctx.accounts.deposit.to_account_info(), 
      ctx.accounts.escrow_authority.to_account_info(), 
      escrow_authority_bump,
      token_acct_balance)?;

    Ok(())
  }
}

#[derive(Accounts)]
#[instruction(sharing_bump: u8, escrow_authority_bump: u8)]
pub struct InitSharingAccount<'info> {
  #[account(
    init, 
    seeds=[b"sharing", escrow.key().as_ref()],
    bump=sharing_bump,
    payer=user,
    space= 8 // all accounts need 8 bytes for the account discriminator prepended to the account
      + 32 // token_account: Pubkey needs 32 bytes
      + 32 // deposit_account: Pubkey needs 32 bytes
      + 8 // split_percent_amount
      + 1 // split_percent_decimals
  )]
  pub sharing_account: Account<'info, SharingAccount>,

  // The token type that the accounts should conform to
  pub mint: Account<'info, Mint>,

  // The in-between place where the tokens will go, before calling "share"
  #[account(
    init,
    payer=user,
    token::mint = mint,
    token::authority = escrow_authority,
  )]
  pub escrow: Account<'info, TokenAccount>,

  #[account(
    seeds=[b"authority", escrow.key().as_ref()],
    bump=escrow_authority_bump,
  )]
  pub escrow_authority: AccountInfo<'info>,

  // The final place where the tokens will go for the original creator, after calling "share"
  pub deposit: Account<'info, TokenAccount>,

  pub user: Signer<'info>,
  pub system_program: Program<'info, System>, 
  pub token_program: Program<'info, Token>,
  pub rent: Sysvar<'info, Rent>,
}


#[derive(Accounts)]
pub struct SetSharingAccountSplitPercent<'info> {
  #[account(mut, has_one=deposit)]
  pub sharing_account: Account<'info, SharingAccount>,

  pub deposit: Account<'info, TokenAccount>,

  pub user: Signer<'info>,
  pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(escrow_authority_bump: u8)]
pub struct ShareBalance<'info> {
  #[account(mut, has_one=escrow, has_one=deposit)]
  pub sharing: Account<'info, SharingAccount>,
  
  // In-between account. When a purchase happens, funds move here, and then are "split" when
  // share is called.
  #[account(mut)]
  pub escrow: Account<'info, TokenAccount>,

  #[account(
    seeds=[b"authority", escrow.key().as_ref()],
    bump=escrow_authority_bump,
  )]
  pub escrow_authority: AccountInfo<'info>,

  // owner of the asset / listing / primary holder
  #[account(mut)]
  pub deposit: Account<'info, TokenAccount>,

  // receives a portion!
  #[account(mut)]
  pub affiliate: Account<'info, TokenAccount>,

  pub token_program: Program<'info, Token>,
  pub user: Signer<'info>,
  pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(escrow_authority_bump: u8)]
pub struct Recover<'info> {
  #[account(mut)]
  pub sharing: Account<'info, SharingAccount>,

  // An escrow
  #[account(mut)]
  pub escrow: Account<'info, TokenAccount>,

  #[account(
    seeds=[b"authority", escrow.key().as_ref()],
    bump=escrow_authority_bump,
  )]
  pub escrow_authority: AccountInfo<'info>,

  // Where the funds are heading
  #[account(mut)]
  pub deposit: Account<'info, TokenAccount>,
  pub token_program: Program<'info, Token>,
  pub system_program: Program<'info, System>,
}


#[account]
pub struct SharingAccount { 
  // escrow; the temp holder of tokens
  pub escrow: Pubkey,

  // where funds are heading
  pub deposit: Pubkey,

  // Note that Borsh doesn't support floats, and so we carry over the pattern
  // used in the token program of having an "amount" and a "decimals".
  // So an "amount" of 100 and a "decimals" of 3 would be 0.1
  pub split_percent_amount: u64,
  pub split_percent_decimals: u8,
}


#[error]
pub enum SharingError {
  
  // You tried to modify the sharing account, but you are not the owner 
  // of the deposit that that sharing account is associated with. 
  #[msg("User Is Not Deposit Owner")]
  UserIsNotDepositOwner,
}

import { Keypair, PublicKey } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import * as splToken from '@solana/spl-token';
import { MAINNET } from './constants';
import { Sharing } from 'target/types/sharing';
import { Program } from '@project-serum/anchor';
import { pda } from './pda';
const { SystemProgram, SYSVAR_RENT_PUBKEY } = anchor.web3;

export async function fetchSharingProgram(
  provider: anchor.Provider,
  programId = MAINNET.programId
) {
  const idl = await anchor.Program.fetchIdl<Sharing>(programId, provider);
  return new anchor.Program(idl, programId, provider);
}

export type SharingAccount = Awaited<
  ReturnType<Program<Sharing>['account']['sharingAccount']['fetch']>
>;

export interface AccountInfo<Acc> {
  account: Acc;
  publicKey: PublicKey;
}

function isAccountInfo<T>(
  arg: AccountInfo<T> | PublicKey
): arg is AccountInfo<T> {
  return (
    (arg as AccountInfo<T>).account !== undefined &&
    (arg as AccountInfo<T>).publicKey !== undefined
  );
}

async function asSharingInfo(
  program: Program<Sharing>,
  arg: AccountInfo<SharingAccount> | PublicKey
): Promise<AccountInfo<SharingAccount>> {
  if (isAccountInfo(arg)) {
    return arg;
  }
  return {
    account: await program.account.sharingAccount.fetch(arg),
    publicKey: arg,
  };
}

// Returns a sharing account associated with this token account
// if one exists.
export async function findSharingAccountIfExists(args: {
  program: Program<Sharing>;
  tokenAccount: anchor.web3.PublicKey;
}): Promise<AccountInfo<SharingAccount> | null> {
  let [sharingPDA, _] = await pda.sharing(
    args.program.programId,
    args.tokenAccount
  );

  try {
    let result = await args.program.account.sharingAccount.fetch(sharingPDA);
    return {
      account: result,
      publicKey: sharingPDA,
    };
  } catch (err) {
    return null;
  }
}

// Creates an instruction that shares the balance of the "from" token account
// if it's possible to do so. Otherwise, returns an empty instructions array
export async function maybeShareBalance(args: {
  program: Program<Sharing>;
  signer?: anchor.web3.PublicKey;
  from: anchor.web3.PublicKey;
  to: anchor.web3.PublicKey;
}) {
  let instructions = [];
  let sharingAccount = await findSharingAccountIfExists({
    program: args.program,
    tokenAccount: args.from,
  });
  if (!sharingAccount) return { instructions };

  return shareBalance({
    program: args.program,
    sharingAccount: sharingAccount,
    affiliateAccount: args.to,
    signer: args.signer,
  });
}

// Creates an instruction that shares the balance of a sharing account's escrow
export async function shareBalance(args: {
  program: Program<Sharing>;
  signer?: anchor.web3.PublicKey;
  sharingAccount: AccountInfo<SharingAccount> | PublicKey;
  affiliateAccount: PublicKey;
}) {
  let sharingAccount = await asSharingInfo(args.program, args.sharingAccount);

  let [authorityPDA, authorityBump] = await pda.authority(
    args.program.programId,
    sharingAccount.account.escrow
  );

  const ix = args.program.instruction.shareBalance(authorityBump, {
    accounts: {
      sharing: sharingAccount.publicKey,
      escrow: sharingAccount.account.escrow,
      escrowAuthority: authorityPDA,
      deposit: sharingAccount.account.deposit,
      affiliate: args.affiliateAccount,
      tokenProgram: splToken.TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      user: args.signer || args.program.provider.wallet.publicKey,
    },
  });

  let instructions = [ix];
  return {
    instructions,
  };
}

export async function initSharingAccount(args: {
  program: Program<Sharing>;
  signer?: anchor.web3.PublicKey;
  deposit: anchor.web3.PublicKey;
  splitPercentAmount: anchor.BN;
  splitPercentDecimals: number;
}) {
  const deposit = await splToken.getAccount(
    args.program.provider.connection,
    args.deposit
  );
  let mint = deposit.mint;

  let escrowKeypair = Keypair.generate();
  const [sharingPDA, sharingBump] = await pda.sharing(
    args.program.programId,
    escrowKeypair.publicKey
  );
  const [authorityPDA, authorityBump] = await pda.authority(
    args.program.programId,
    escrowKeypair.publicKey
  );

  if (
    args.splitPercentDecimals <= 0 &&
    args.splitPercentAmount.toNumber() >= 1
  ) {
    throw new Error(
      "You shouldn't create a sharing account with more than 100% split percentage.\n\nIf decimals=0, and amount=1, then that's 100% (or 1.0). If decimals=2, and amount=5, then that's 5% (or 0.05), because you've taken 5.0, and moved the decimal over 2 places."
    );
  }

  let ix = args.program.instruction.initSharingAccount(
    sharingBump,
    authorityBump,
    args.splitPercentAmount,
    args.splitPercentDecimals,
    {
      accounts: {
        sharingAccount: sharingPDA,
        mint: mint,
        escrow: escrowKeypair.publicKey,
        escrowAuthority: authorityPDA,
        deposit: deposit,
        systemProgram: SystemProgram.programId,
        user: args.program.provider.wallet.publicKey,
        tokenProgram: splToken.TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      },
      signers: [escrowKeypair],
    }
  );

  let instructions = [ix];

  return {
    instructions,
    escrow: escrowKeypair,
    sharing: sharingPDA,
    signers: [escrowKeypair],
  };
}

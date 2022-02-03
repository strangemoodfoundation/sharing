import { Sharing } from 'target/types/sharing';
import * as anchor from '@project-serum/anchor';
import * as splToken from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
const { SystemProgram, SYSVAR_RENT_PUBKEY } = anchor.web3;

export async function createTokenAccount(
  program: anchor.Program<Sharing>,
  mint: anchor.web3.PublicKey
) {
  const conn = program.provider.connection;
  let lamports = anchor.web3.LAMPORTS_PER_SOL;
  let signature = await program.provider.connection.requestAirdrop(
    program.provider.wallet.publicKey,
    lamports
  );

  let tx = new anchor.web3.Transaction({
    feePayer: program.provider.wallet.publicKey,
  });

  let keypair = anchor.web3.Keypair.generate();

  tx.add(
    SystemProgram.createAccount({
      fromPubkey: program.provider.wallet.publicKey,
      newAccountPubkey: keypair.publicKey,
      lamports: await splToken.getMinimumBalanceForRentExemptAccount(conn),
      space: splToken.AccountLayout.span,
      programId: splToken.TOKEN_PROGRAM_ID,
    })
  );
  tx.add(
    splToken.createInitializeAccountInstruction(
      keypair.publicKey,
      mint,
      program.provider.wallet.publicKey
    )
  );

  await program.provider.send(tx, [keypair]);
  return keypair;
}

export async function createMint(program: anchor.Program<Sharing>) {
  const conn = program.provider.connection;
  let lamports = anchor.web3.LAMPORTS_PER_SOL;
  let signature = await program.provider.connection.requestAirdrop(
    program.provider.wallet.publicKey,
    lamports
  );

  let tx = new anchor.web3.Transaction({
    feePayer: program.provider.wallet.publicKey,
  });

  let keypair = anchor.web3.Keypair.generate();

  tx.add(
    SystemProgram.createAccount({
      fromPubkey: program.provider.wallet.publicKey,
      newAccountPubkey: keypair.publicKey,
      lamports: await splToken.getMinimumBalanceForRentExemptMint(conn),
      space: splToken.MintLayout.span,
      programId: splToken.TOKEN_PROGRAM_ID,
    })
  );
  tx.add(
    splToken.createInitializeMintInstruction(
      keypair.publicKey,
      0,
      program.provider.wallet.publicKey,
      program.provider.wallet.publicKey
    )
  );

  await program.provider.send(tx, [keypair]);
  return keypair;
}

export async function balance(
  program: anchor.Program<Sharing>,
  address: PublicKey
) {
  const conn = program.provider.connection;

  const acct = await splToken.getAccount(conn, address);
  return acct.amount;
}

export async function mintTo(
  program: anchor.Program<Sharing>,
  mint: PublicKey,
  destination: PublicKey,
  amount: number
) {
  const conn = program.provider.connection;
  let lamports = anchor.web3.LAMPORTS_PER_SOL;
  let signature = await program.provider.connection.requestAirdrop(
    program.provider.wallet.publicKey,
    lamports
  );

  let tx = new anchor.web3.Transaction({
    feePayer: program.provider.wallet.publicKey,
  });

  tx.add(
    splToken.createMintToInstruction(
      mint,
      destination,
      program.provider.wallet.publicKey,
      amount
    )
  );

  await program.provider.send(tx);
}

export async function createAndMintToken(
  program: anchor.Program<Sharing>,
  amount: number
) {
  const mint = await createMint(program);
  const acct = await createTokenAccount(program, mint.publicKey);
  await mintTo(program, mint.publicKey, acct.publicKey, amount);
  return {
    mint: mint.publicKey,
    tokenAccount: acct.publicKey,
  };
}

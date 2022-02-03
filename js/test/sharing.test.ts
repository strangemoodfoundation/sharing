import assert from 'assert';
import * as anchor from '@project-serum/anchor';
import * as splToken from '@solana/spl-token';
import { Program } from '@project-serum/anchor';
import { Sharing } from 'target/types/sharing';
import { createMint, createTokenAccount, mintTo, balance } from './utils';
import { NATIVE_MINT } from '@solana/spl-token';
import { pda } from '../pda';
import { Keypair } from '@solana/web3.js';
const { SystemProgram, SYSVAR_RENT_PUBKEY } = anchor.web3;

describe('sharing', () => {
  const provider = anchor.Provider.env();
  // Configure the client to use the local cluster.
  anchor.setProvider(provider);

  // sharing program
  // @ts-ignore
  const program = anchor.workspace.Sharing as Program<Sharing>;

  it('can split funds', async () => {
    let mint = await createMint(program);

    let escrowKeypair = Keypair.generate();
    const [sharingPDA, sharingBump] = await pda.sharing(
      program.programId,
      escrowKeypair.publicKey
    );
    const [authorityPDA, authorityBump] = await pda.authority(
      program.programId,
      escrowKeypair.publicKey
    );

    const deposit = await createTokenAccount(program, mint.publicKey);

    await program.rpc.initSharingAccount(
      sharingBump,
      authorityBump,
      new anchor.BN(5),
      new anchor.BN(2),
      {
        accounts: {
          sharingAccount: sharingPDA,
          mint: mint.publicKey,
          escrow: escrowKeypair.publicKey,
          escrowAuthority: authorityPDA,
          deposit: deposit.publicKey,
          systemProgram: SystemProgram.programId,
          user: provider.wallet.publicKey,
          tokenProgram: splToken.TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        },
        signers: [escrowKeypair],
      }
    );

    const sharing = await program.account.sharingAccount.fetch(sharingPDA);
    assert.equal(sharing.deposit.toString(), deposit.publicKey.toString());
    assert.equal(sharing.escrow.toString(), escrowKeypair.publicKey.toString());
    assert.equal(sharing.splitPercentAmount.toNumber(), 5);
    assert.equal(sharing.splitPercentDecimals, 2);

    // Mint some tokens into the escrow
    await mintTo(program, mint.publicKey, sharing.escrow, 100);
    assert.equal(await balance(program, sharing.escrow), 100);

    const affiliate = await createTokenAccount(program, mint.publicKey);
    const sig = await program.rpc.shareBalance(authorityBump, {
      accounts: {
        sharing: sharingPDA,
        escrow: escrowKeypair.publicKey,
        escrowAuthority: authorityPDA,
        deposit: deposit.publicKey,
        affiliate: affiliate.publicKey,
        systemProgram: SystemProgram.programId,
        user: provider.wallet.publicKey,
        tokenProgram: splToken.TOKEN_PROGRAM_ID,
      },
    });
    await program.provider.connection.confirmTransaction(sig, 'finalized');

    assert.equal(await balance(program, sharing.escrow), 0);
    assert.equal(await balance(program, affiliate.publicKey), 5);
    assert.equal(await balance(program, sharing.deposit), 95);
  });
});

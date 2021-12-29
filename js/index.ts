import { MAINNET, TESTNET } from "./constants";
import { pda } from "./pda";
import * as splToken from "@solana/spl-token";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { Program } from "@project-serum/anchor";
import { Sharing } from "../target/types/sharing";

export default {
  MAINNET,
  TESTNET,
};

const initSharingAccount = async (
  program: Program<Sharing>,
  user: PublicKey,
  config: { splitPercent: number }
) => {
  // wrapped SOL account associated with the current user
  let associatedSolAddress = await splToken.Token.getAssociatedTokenAddress(
    splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
    splToken.TOKEN_PROGRAM_ID,
    splToken.NATIVE_MINT,
    user
  );

  let [sharingPDA, sharingBump] = await pda.sharing(associatedSolAddress);

  let associatedSharingSolAddress =
    await splToken.Token.getAssociatedTokenAddress(
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
      splToken.TOKEN_PROGRAM_ID,
      splToken.NATIVE_MINT,
      sharingPDA
    );

  const splitAmount = Math.trunc(config.splitPercent);
  const splitDecimal = (config.splitPercent - splitAmount).toFixed(3);

  await program.rpc.initSharingAccount(
    sharingBump,
    new anchor.BN(splitAmount),
    new anchor.BN(splitDecimal),
    {
      accounts: {
        sharingAccount: sharingPDA,
        depositAccount: associatedSolAddress,
        tokenAccount: associatedSharingSolAddress,
        systemProgram: SystemProgram.programId,
      },
    }
  );
};

const initSharingAccountOption2 = async (
  program: Program<Sharing>,
  user: PublicKey,
  config: { splitPercent: number }
) => {
  const sharingKeypair = anchor.web3.Keypair.generate();

  // wrapped SOL account associated with the current user
  let associatedSolAddress = await splToken.Token.getAssociatedTokenAddress(
    splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
    splToken.TOKEN_PROGRAM_ID,
    splToken.NATIVE_MINT,
    user
  );

  //   let [sharingPDA, sharingBump] = await pda.sharing(associatedSolAddress);

  let associatedSharingSolAddress =
    await splToken.Token.getAssociatedTokenAddress(
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
      splToken.TOKEN_PROGRAM_ID,
      splToken.NATIVE_MINT,
      sharingKeypair
    );

  const splitAmount = Math.trunc(config.splitPercent);
  const splitDecimal = (config.splitPercent - splitAmount).toFixed(3);

  await program.rpc.initSharingAccount(
    // sharingBump,
    new anchor.BN(splitAmount),
    new anchor.BN(splitDecimal),
    {
      accounts: {
        sharingAccount: sharingKeypair,
        depositAccount: associatedSolAddress,
        tokenAccount: associatedSharingSolAddress,
        systemProgram: SystemProgram.programId,
      },
    }
  );
};

import { ENV, MAINNET, TESTNET, DEVNET } from './constants';
import { pda } from './pda';
import * as splToken from '@solana/spl-token';
import {
  ConfirmOptions,
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import { BN, Program, Provider, web3 } from '@project-serum/anchor';
import { Sharing } from '../../target/types/sharing';
import { Wallet } from '@project-serum/anchor/dist/cjs/provider';

export default {
  MAINNET,
  DEVNET,
  TESTNET,
};

const borshifyFloat = (a: number) => {
  const pieces = a.toString().split('.');
  const splitAmount = parseInt(pieces[0]);
  const splitDecimal = parseInt(pieces[1]);

  return [splitAmount, splitDecimal];
};

// you always get the same address if you pass the same mint and token account owner
const getAssociatedTokenAddress = async (tokenAcctAuthority: PublicKey) => {
  const associatedTokenAddress = await splToken.Token.getAssociatedTokenAddress(
    splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
    splToken.TOKEN_PROGRAM_ID,
    splToken.NATIVE_MINT,
    tokenAcctAuthority
    // true
  );

  return associatedTokenAddress;
};

const getOrCreateAssociatedTokenAccount = async (
  connection: Connection,
  owner: PublicKey,
  payer: PublicKey
) => {
  const associatedTokenAddress = await getAssociatedTokenAddress(owner);
  const acctInfo = await connection.getAccountInfo(associatedTokenAddress);

  let itx: TransactionInstruction | null = null;

  if (!acctInfo || !acctInfo.owner) {
    console.log(
      'Account Info does not exist! Creating Associated token account'
    );
    itx = await splToken.Token.createAssociatedTokenAccountInstruction(
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
      splToken.TOKEN_PROGRAM_ID,
      splToken.NATIVE_MINT,
      associatedTokenAddress,
      owner, // token account owner (which we used to calculate ata)
      payer
    );
    console.log(itx);
  } else {
    console.log('Associated Token Account Info exists:', {
      data: acctInfo.data.toString(),
      owner: acctInfo.owner.toString(),
    });
  }

  return {
    address: associatedTokenAddress,
    instruction: itx,
  };
};

const getSharingAccounts = async (
  connection: Connection,
  user: PublicKey,
  assetPubkey: PublicKey
) => {
  // wrapped SOL account associated with the current user.
  let { address: associatedSolAddress, instruction: createAccountInstruction } =
    await getOrCreateAssociatedTokenAccount(connection, user, user);

  // The sharing account address is derived from the current user's token acct
  let [sharingPDA, sharingBump] = await pda.sharing(
    associatedSolAddress,
    assetPubkey
  );

  // // The sharing account TOKEN address is related to the sharing acct address
  const escrowKeypair = Keypair.generate();

  // alloc space for account
  const createEscrowTokenAcctInstruction = SystemProgram.createAccount({
    fromPubkey: user,
    /** Public key of the created account */
    newAccountPubkey: escrowKeypair.publicKey,
    /** Amount of lamports to transfer to the created account */
    lamports: await splToken.Token.getMinBalanceRentForExemptAccount(
      connection
    ),
    /** Amount of space in bytes to allocate to the created account */
    space: splToken.AccountLayout.span,
    /** Public key of the program to assign as the owner of the created account */
    programId: splToken.TOKEN_PROGRAM_ID,
  });

  // initialize token acct
  const initEscrowTokenAcctInstruction =
    splToken.Token.createInitAccountInstruction(
      splToken.TOKEN_PROGRAM_ID,
      splToken.NATIVE_MINT,
      escrowKeypair.publicKey,
      sharingPDA
    );

  return {
    associatedSolAddress,
    initEscrowTokenAcctInstruction,
    sharingPDA,
    sharingBump,
    createAccountInstruction,
    createEscrowTokenAcctInstruction,
    escrowKeypair,
  };
};

/**
 * *
 * @param program
 * @param user
 * @param config
 */
export const initSharingAccount = async (
  connection: Connection,
  program: Program<Sharing>,
  user: PublicKey,
  assetPubkey: PublicKey,
  config: { splitPercent: number }
) => {
  const tx = new Transaction();
  const {
    createEscrowTokenAcctInstruction,
    initEscrowTokenAcctInstruction,
    associatedSolAddress,
    sharingBump,
    sharingPDA,
    createAccountInstruction,
    escrowKeypair,
  } = await getSharingAccounts(connection, user, assetPubkey);

  if (createAccountInstruction) tx.add(createAccountInstruction);
  if (createEscrowTokenAcctInstruction)
    tx.add(createEscrowTokenAcctInstruction);
  if (initEscrowTokenAcctInstruction) tx.add(initEscrowTokenAcctInstruction);

  const [splitAmount, splitDecimal] = borshifyFloat(config.splitPercent);

  const initTx = program.instruction.initSharingAccount(
    sharingBump,
    assetPubkey,
    new BN(splitAmount),
    new BN(splitDecimal),
    {
      accounts: {
        user,

        // auto generated
        sharingAccount: sharingPDA,

        tokenAccount: escrowKeypair.publicKey,
        depositAccount: associatedSolAddress,

        // system defaults
        systemProgram: SystemProgram.programId,
      },
    }
  );

  tx.add(initTx);
  return { tx, signers: [escrowKeypair] };
};

// TODO
export const updateSharingAccountPercentage = async (
  connection: Connection,
  program: Program<Sharing>,
  user: PublicKey,
  assetPubkey: PublicKey,
  config: { splitPercent: number }
) => {
  const {
    // escrowBump,
    // escrowTokenPDA,
    associatedSolAddress,
    // sharingBump,
    sharingPDA,
  } = await getSharingAccounts(connection, user, assetPubkey);

  const [splitAmount, splitDecimal] = borshifyFloat(config.splitPercent);

  await program.rpc.updateSharingAccount(
    new BN(splitAmount),
    new BN(splitDecimal),
    {
      accounts: {
        user: user,
        sharingAccount: sharingPDA,
        systemProgram: SystemProgram.programId,
      },
    }
  );
};

export const fetchSharingProgram = async (
  provider: Provider,
  programId = ENV.SHARING_PROGRAM_ID
) => {
  const idl = await Program.fetchIdl<Sharing>(programId, provider);
  if (!idl)
    throw new Error(
      'IDL Not Found: Did you make sure to run `anchor idl anchor idl init --filepath target/idl/sharing.json "[PROGRAM_ID]" --provider.cluster [CLUSETER]`'
    );

  return new Program(idl, programId, provider);
};

export const getSharingProvider = async (
  connection: Connection,
  wallet: Wallet,
  opts?: ConfirmOptions
) => {
  if (!wallet) throw new Error('Wallet Not Connected');

  const provider = new Provider(connection, wallet, opts ?? {});

  return provider;
};

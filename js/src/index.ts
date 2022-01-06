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
import { BN, Program, Provider } from '@project-serum/anchor';
import { Sharing } from './sharing';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { borshifyFloat, unBorshifyFloat } from './helpers';

export default {
  MAINNET,
  DEVNET,
  TESTNET,
};

export { Sharing, unBorshifyFloat };

export const sharingPDA = pda.sharing;

const getAssociatedTokenAddress = async (tokenAcctAuthority: PublicKey) => {
  // you always get the same address if you pass the same mint and token account owner
  const associatedTokenAddress = await splToken.Token.getAssociatedTokenAddress(
    splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
    splToken.TOKEN_PROGRAM_ID,
    splToken.NATIVE_MINT,
    tokenAcctAuthority
  );

  return associatedTokenAddress;
};

export const getOrCreateAssociatedTokenAccount = async (
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

const createEscrowTokenAccountInstructions = async (
  connection: Connection,
  user: PublicKey,
  sharingPDA: PublicKey
) => {
  const tx = new Transaction();
  const escrowKeypair = Keypair.generate();

  // alloc space for account
  tx.add(
    SystemProgram.createAccount({
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
    })
  );

  // initialize token acct
  tx.add(
    splToken.Token.createInitAccountInstruction(
      splToken.TOKEN_PROGRAM_ID,
      splToken.NATIVE_MINT,
      escrowKeypair.publicKey,
      sharingPDA
    )
  );

  return { tx, escrowKeypair };
};

export const deriveSharingAccountAddress = async (
  user: PublicKey,
  assetPubkey: PublicKey,
  sharingProgramId?: PublicKey
) => {
  const associatedSolAddress = await getAssociatedTokenAddress(user);
  let [sharingAccountAddress, _] = await pda.sharing(
    associatedSolAddress,
    assetPubkey,
    sharingProgramId
  );

  return sharingAccountAddress;
};

const getSharingAccount = async (
  connection: Connection,
  program: Program<Sharing>,
  user: PublicKey,
  owner: PublicKey,
  assetPubkey: PublicKey,
  sharingProgramId?: PublicKey
) => {
  console.log('I am here! getSharingAccount');
  // wrapped SOL account associated with the current user.
  let { address: associatedSolAddress, instruction: createAccountInstruction } =
    await getOrCreateAssociatedTokenAccount(connection, owner, user);

  // The sharing account address is derived from the current user's token acct
  let [sharingPDA, sharingBump] = await pda.sharing(
    associatedSolAddress,
    assetPubkey,
    sharingProgramId
  );

  let sharingAccount;
  try {
    sharingAccount = await program.account.sharingAccount.fetch(sharingPDA);
  } catch (err) {
    console.error('Attempted to fetch sharing account; it failed.', err);
  }

  return {
    associatedSolAddress,
    sharingPDA,
    sharingBump,
    createAccountInstruction,
    sharingAccount,
  };
};

/**
 * @param connection
 * @param user - purchasing the asset
 * @param owner - creator of the asset
 * @param assetPubkey - some pubkey of a listing somewhere
 * @param affiliateAccount - an account that supports wrapped sol
 * @param purchaseTx - this fn should result in funds placed in the sharing account
 * @param sharingProgramId
 */
export const purchaseAssetByAffiliate = async (
  program: Program<Sharing>,
  user: PublicKey,
  sharingPDA: PublicKey,
  affiliateAccount: PublicKey,
  purchaseTx: Transaction | TransactionInstruction
) => {
  const tx = new Transaction();

  tx.add(purchaseTx);

  const sharingAccount = await program.account.sharingAccount.fetch(sharingPDA);

  tx.add(
    program.instruction.shareBalance({
      accounts: {
        user,
        sharingAccount: sharingPDA,
        tokenAccount: sharingAccount.tokenAccount,
        depositAccount: sharingAccount.depositAccount,
        affiliateAccount,
        systemProgram: SystemProgram.programId,
      },
    })
  );

  return { tx };
};

/**
 * @param connection
 * @param user - purchasing the asset
 * @param owner - creator of the asset
 * @param assetPubkey - some pubkey of a listing somewhere
 * @param affiliateAccount
 * @param purchaseTx - this fn should result in funds placed in the sharing account
 * @param sharingProgramId
 */
export const recover = async (
  connection: Connection,
  program: Program<Sharing>,
  user: PublicKey,
  owner: PublicKey,
  assetPubkey: PublicKey,
  sharingProgramId?: PublicKey
) => {
  const tx = new Transaction();

  const { sharingPDA, sharingAccount } = await getSharingAccount(
    connection,
    program,
    user,
    owner,
    assetPubkey,
    sharingProgramId
  );

  if (!sharingAccount) throw new Error('This sharing account does not exist');

  tx.add(
    program.instruction.recover({
      accounts: {
        user,
        sharingAccount: sharingPDA,
        tokenAccount: sharingAccount.tokenAccount,
        depositAccount: sharingAccount.depositAccount,
        systemProgram: SystemProgram.programId,
      },
    })
  );

  return { tx };
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
  config: { splitPercent: number },
  sharingProgramId?: PublicKey
) => {
  const tx = new Transaction();
  const {
    associatedSolAddress,
    sharingBump,
    sharingPDA,
    createAccountInstruction,
  } = await getSharingAccount(
    connection,
    program,
    user,
    user, // here, user is the owner
    assetPubkey,
    sharingProgramId
  );

  if (createAccountInstruction) {
    console.log('We do not have a sharing account -- creating it now');
    tx.add(createAccountInstruction);
  }

  const { tx: escrowTx, escrowKeypair } =
    await createEscrowTokenAccountInstructions(connection, user, sharingPDA);
  tx.add(escrowTx);

  const [splitAmount, splitDecimal] = borshifyFloat(config.splitPercent);
  tx.add(
    program.instruction.initSharingAccount(
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
    )
  );

  console.log({
    msg: 'creating sharing accout',
    acct: sharingPDA.toString(),
    tokenAcctForSharingAcct: escrowKeypair.publicKey.toString(),
  });

  return { tx, signers: [escrowKeypair] };
};

export const updateSharingAccountSplitPercent = async (
  connection: Connection,
  program: Program<Sharing>,
  user: PublicKey,
  assetPubkey: PublicKey,
  config: { splitPercent: number },
  sharingProgramId?: PublicKey
) => {
  const { sharingPDA } = await getSharingAccount(
    connection,
    program,
    user,
    user, // here, user is owner
    assetPubkey,
    sharingProgramId
  );
  const [splitAmount, splitDecimal] = borshifyFloat(config.splitPercent);

  const tx = new Transaction();
  tx.add(
    program.instruction.updateSharingAccountSplitPercent(
      new BN(splitAmount),
      new BN(splitDecimal),
      {
        accounts: {
          user: user,
          sharingAccount: sharingPDA,
          systemProgram: SystemProgram.programId,
        },
      }
    )
  );

  return { tx };
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
  wallet: WalletContextState,
  opts?: ConfirmOptions
) => {
  if (!wallet) throw new Error('Wallet Not Connected');

  const provider = new Provider(connection, wallet, opts ?? {});

  return provider;
};

import { web3 } from '@project-serum/anchor';
import {
  useConnection,
  useWallet,
  WalletContextState,
} from '@solana/wallet-adapter-react';
import { Wallet } from '@solana/wallet-adapter-wallets';
import {
  Connection,
  Keypair,
  Signer,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  fetchSharingProgram,
  getSharingProvider,
  initSharingAccount,
  updateSharingAccountSplitPercent,
} from '@strangemood/sharing';

const DEMO_ASSET_PUBKEY = '6Y7vqCM3c7xSNcfL6d5dpboudvVRpbzigpUkUBuavXSt';

const sendAndSign = async (
  connection: Connection,
  wallet: WalletContextState,
  tx: Transaction,
  signers?: Signer[]
) => {
  console.log('TX:', tx);
  const sig = await wallet.sendTransaction(tx, connection, {
    signers,
  });
  console.log('SIG:', sig);

  const confirmation = await connection.confirmTransaction(sig);
  console.log('CONFIRMED TX:', confirmation);

  return { tx, sig, confirmation };
};

export const useSharingAccount = () => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const initialize = async (splitPercent: number) => {
    if (!wallet.publicKey) throw new Error('Wallet not connected');

    // @ts-ignore
    const provider = await getSharingProvider(connection, wallet);
    const program = await fetchSharingProgram(provider);

    // TODO: pass in real asset lolol.
    const asset = Keypair.generate().publicKey;
    console.log('Created a new asset keypair:', asset.toString());

    const { tx, signers } = await initSharingAccount(
      connection,
      program,
      wallet.publicKey,
      asset,
      {
        splitPercent,
      }
    );

    return await sendAndSign(connection, wallet, tx, signers);
  };

  const updateSplitPercent = async (splitPercent: number) => {
    if (!wallet.publicKey) throw new Error('Wallet not connected');

    const asset = new web3.PublicKey(DEMO_ASSET_PUBKEY);
    console.log('Using asset keypair:', asset.toString());

    // @ts-ignore
    const provider = await getSharingProvider(connection, wallet);
    const program = await fetchSharingProgram(provider);

    const { tx } = await updateSharingAccountSplitPercent(
      connection,
      program,
      wallet.publicKey,
      asset,
      {
        splitPercent,
      }
    );

    return await sendAndSign(connection, wallet, tx);
  };

  return { initialize, updateSplitPercent };
};

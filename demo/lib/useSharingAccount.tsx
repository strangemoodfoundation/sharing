import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Keypair, TransactionInstruction } from '@solana/web3.js';
import {
  fetchSharingProgram,
  getSharingProvider,
  initSharingAccount,
} from '@strangemood/sharing';

export const useSharingAccount = () => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const initialize = async (splitPercent: number) => {
    if (!wallet.publicKey) throw new Error('Wallet not connected');

    // @ts-ignore
    const provider = await getSharingProvider(connection, wallet);
    const program = await fetchSharingProgram(provider);

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

    console.log('PRE-SEND-TRANSACTION:', tx);

    const sig = await wallet.sendTransaction(tx, connection, {
      signers,
    });
    console.log('SIGNATURE:', sig);

    const confirmation = await connection.confirmTransaction(sig);
    console.log('CONFIRMED TRANSACTION:', confirmation);
  };

  return { initialize };
};

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

    console.log('step 1: initializing in hook!');
    // @ts-ignore
    const provider = await getSharingProvider(connection, wallet);

    console.log('step 2: initializing in hook!');
    console.log(provider);

    const program = await fetchSharingProgram(provider);

    console.log('step 3: initializing in hook!');

    const asset = Keypair.generate().publicKey;

    console.log('Created a new asset keypair:', asset.toString());

    const trans = await initSharingAccount(
      connection,
      program,
      wallet.publicKey,
      asset,
      {
        splitPercent,
      }
    );

    console.log('TRANSACTION', trans);

    // const instr: TransactionInstruction = trans.instructions[0];

    wallet.sendTransaction(trans, connection);
  };

  return { initialize };
};

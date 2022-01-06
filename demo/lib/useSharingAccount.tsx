import { Program, Provider, web3 } from '@project-serum/anchor';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  Keypair,
  PublicKey,
  Signer,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  fetchSharingProgram,
  getSharingProvider,
  initSharingAccount,
  updateSharingAccountSplitPercent,
  recover,
  Sharing,
  purchaseAssetByAffiliate,
  sharingPDA,
} from '@strangemood/sharing';
import { useEffect, useState } from 'react';
import { sendAndSign } from './util';

const DEMO_ASSET_PUBKEY = '6Y7vqCM3c7xSNcfL6d5dpboudvVRpbzigpUkUBuavXSt';

export const useSharingAccount = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [program, setProgram] = useState<Program<Sharing> | undefined>(
    undefined
  );

  const fetchProgram = async () => {
    // @ts-ignore
    const sharingProvider = await getSharingProvider(connection, wallet);
    const sharingProgram = await fetchSharingProgram(sharingProvider);

    setProgram(sharingProgram);
  };

  useEffect(() => {
    fetchProgram();
  }, []);

  const initialize = async (splitPercent: number) => {
    if (!wallet.publicKey || !program) throw new Error('Not Connected');

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
    if (!wallet.publicKey || !program) throw new Error('Not Connected');

    const asset = new web3.PublicKey(DEMO_ASSET_PUBKEY);
    console.log('Using asset keypair:', asset.toString());

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

  const recoverAccountTokens = async () => {
    if (!wallet.publicKey || !program) throw new Error('Not Connected');

    const asset = new web3.PublicKey(DEMO_ASSET_PUBKEY);
    console.log('Using asset keypair:', asset.toString());

    const { tx } = await recover(
      connection,
      program,
      wallet.publicKey,
      wallet.publicKey,
      asset
    );

    return await sendAndSign(connection, wallet, tx);
  };

  const purchaseViaAffiliate = async (
    affiliate: web3.PublicKey,
    listing: PublicKey,
    solDeposit: PublicKey,
    purchaseTx: { tx: Transaction | TransactionInstruction; signers?: Signer[] }
  ) => {
    if (!wallet.publicKey || !program) throw new Error('Not Connected');

    const sharingAddr = await sharingPDA(solDeposit, listing);

    const { tx } = await purchaseAssetByAffiliate(
      program,
      wallet.publicKey,
      sharingAddr[0],
      affiliate,
      purchaseTx.tx
    );

    return await sendAndSign(connection, wallet, tx, purchaseTx.signers);
  };

  return {
    initialize,
    updateSplitPercent,
    recoverAccountTokens,
    purchaseViaAffiliate,
  };
};

// import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

import { Keypair, PublicKey } from '@solana/web3.js';
import React, { FC, useEffect, useState } from 'react';

import * as anchor from '@project-serum/anchor';

import {
  fetchSharingProgram,
  getSharingProvider,
  initSharingAccount,
  updateSharingAccountPercentage,
} from '@strangemood/sharing';
import { useSharingAccount } from '../lib/useSharingAccount';

export const SharingExample: FC = () => {
  const { initialize } = useSharingAccount();
  const { connection } = useConnection();
  const wallet = useWallet();

  const [sharingPercentage, setSharingPercentage] = useState<string>('12.5');

  const opts: anchor.web3.ConfirmOptions = {
    preflightCommitment: 'recent',
    commitment: 'recent',
  };

  const updateSplitPercent = async () => {
    // todo! get public key seed first. from log above
    if (!wallet.publicKey) throw new Error('Wallet not connected');

    // @ts-ignore
    const provider = await getSharingProvider(connection, wallet);
    const program = await fetchSharingProgram(provider);

    const asset = new PublicKey('');

    console.log('Created a new asset keypair:', asset.toString());

    updateSharingAccountPercentage(
      connection,
      program,
      wallet.publicKey,
      asset,
      {
        splitPercent: parseFloat(sharingPercentage),
      }
    );
  };

  // const sendTransaction = async () => {
  //   if (!wallet.publicKey) throw new WalletNotConnectedError();

  //   // @ts-ignore
  //   const tx = await transferWithMemo(connection, wallet, {
  //     from: wallet.publicKey,
  //     to: sharingPercentage,
  //     amount: new anchor.BN(transferAmount),
  //     memo,
  //   });

  //   // refresh list!
  //   fetchCurrentUserMemos();
  // };

  // const fetchCurrentUserMemos = async () => {
  //   if (!wallet.publicKey) return;

  //   // @ts-ignore
  //   const provider = await getMemoProvider(connection, wallet, opts);

  //   const memos = await getLastMemos(
  //     connection,
  //     (
  //       await getMemoAccountForPubkey(connection, provider.wallet.publicKey)
  //     ).pubkey
  //   );

  //   console.log({ memos });
  //   setTransactionData([...memos]);
  // };

  return (
    <div style={{ margin: 20, padding: 20 }}>
      <p>***</p>
      <p>1. Create a "sharing account"</p>
      <input
        onChange={(event) => setSharingPercentage(event.target.value)}
        value={sharingPercentage}
        placeholder={'12.5'}
      ></input>
      <button
        onClick={() => initialize(parseFloat(sharingPercentage))}
        disabled={!wallet || !wallet.publicKey}
      >
        Create Sharing Account
      </button>
      <p>2. Update strangemood destination account to be the sharing account</p>
      <p>3. Invoke "pay via affiliate" </p>

      <p>***</p>
    </div>
  );
};

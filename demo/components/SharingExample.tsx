import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import React, { FC, useState } from 'react';

import * as anchor from '@project-serum/anchor';

import { useSharingAccount } from '../lib/useSharingAccount';
import { PublicKey } from '@solana/web3.js';
import { useStrangemood } from '../lib/useStrangemood';

export const SharingExample: FC = () => {
  const { initialize, updateSplitPercent, purchaseViaAffiliate } =
    useSharingAccount();
  const { purchaseListingTransaction } = useStrangemood();
  const { connection } = useConnection();
  const wallet = useWallet();

  const [sharingPercentage, setSharingPercentage] = useState<string>('12.5');
  const [affiliatePublicKey, setAffiliatePublicKey] = useState<string>('');
  const [listingPubkey, setListingPubkey] = useState<string>('');

  const opts: anchor.web3.ConfirmOptions = {
    preflightCommitment: 'recent',
    commitment: 'recent',
  };

  const setDeposits = () => {
    // setListingDeposits()
  };

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
      <button
        onClick={() => updateSplitPercent(parseFloat(sharingPercentage))}
        disabled={!wallet || !wallet.publicKey}
      >
        Update Sharing Account Split
      </button>

      <p>2. Update strangemood destination account to be the sharing account</p>
      <button
        onClick={() => setDeposits()}
        disabled={!wallet || !wallet.publicKey}
      >
        Update Sharing Account Split
      </button>
      <p>3. Invoke "purchase via affiliate" </p>
      <input
        onChange={(event) => setAffiliatePublicKey(event.target.value)}
        value={affiliatePublicKey}
        placeholder={'affiliate pubkey'}
      ></input>
      <input
        onChange={(event) => setListingPubkey(event.target.value)}
        value={listingPubkey}
        placeholder={'listing pubkey'}
      ></input>
      <button
        onClick={async () => {
          await purchaseViaAffiliate(
            new PublicKey(affiliatePublicKey),
            new PublicKey(listingPubkey),
            await purchaseListingTransaction(new PublicKey(listingPubkey))
          );
        }}
        disabled={
          !wallet || !wallet.publicKey || affiliatePublicKey.length === 0
        }
      >
        Update Sharing Account Split
      </button>

      <p>***</p>
    </div>
  );
};

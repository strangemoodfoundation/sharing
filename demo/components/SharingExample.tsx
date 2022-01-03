import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import React, { FC, useEffect, useState } from 'react';

import * as anchor from '@project-serum/anchor';

import { useSharingAccount } from '../lib/useSharingAccount';

export const SharingExample: FC = () => {
  const { initialize, updateSplitPercent } = useSharingAccount();
  const { connection } = useConnection();
  const wallet = useWallet();

  const [sharingPercentage, setSharingPercentage] = useState<string>('12.5');

  const opts: anchor.web3.ConfirmOptions = {
    preflightCommitment: 'recent',
    commitment: 'recent',
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
      <p>3. Invoke "pay via affiliate" </p>

      <p>***</p>
    </div>
  );
};

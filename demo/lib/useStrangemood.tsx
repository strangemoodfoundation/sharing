import { Program, Provider, web3 } from '@project-serum/anchor';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Keypair, PublicKey, Transaction } from '@solana/web3.js';
import {
  getSharingProvider,
  purchaseAssetByAffiliate,
} from '@strangemood/sharing';
import {
  fetchStrangemoodProgram,
  MAINNET,
  purchaseListing,
  setListingDeposits,
  Strangemood,
  TESTNET,
} from '@strangemood/strangemood';

import { useEffect, useState } from 'react';
import { CLUSTER } from './constants';
import { sendAndSign } from './util';

export const useStrangemood = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [program, setProgram] = useState<Program<Strangemood> | undefined>(
    undefined
  );

  const fetchProgram = async () => {
    const sharingProvider = await getSharingProvider(connection, wallet);
    const strangeProgram = await fetchStrangemoodProgram(
      sharingProvider,
      CLUSTER.STRANGEMOOD_PROGRAM_ID
    );

    strangeProgram ?? setProgram(strangeProgram);
  };

  useEffect(() => {
    fetchProgram();
  }, []);

  const updateSolDeposit = async (
    listingPublicKey: PublicKey,
    newSolDeposit: PublicKey
  ) => {
    if (!wallet.publicKey || !program) throw new Error('Not Connected');

    const listingAcct = await program.account.listing
      .fetch(listingPublicKey)
      .then((listing) => {
        console.log('Found listing');
        console.log(listing);
        return listing;
      })
      .catch(() => {
        return null;
      });

    const currentVoteDeposit = listingAcct?.voteDeposit;

    if (!currentVoteDeposit)
      throw new Error('Listing needs to have a vote deposit...');

    if (wallet.publicKey != listingAcct.authority) {
      throw new Error(
        'You need to be the listing authority to update the deposit account'
      );
    }

    const { tx } = await setListingDeposits(
      program as any,
      wallet.publicKey,
      listingPublicKey,
      currentVoteDeposit,
      newSolDeposit
    );

    return await sendAndSign(connection, wallet, tx);
  };

  const purchaseListingTransaction = async (listingPublicKey: PublicKey) => {
    if (!wallet.publicKey || !program) throw new Error('Not Connected');

    const listingAcct = await program.account.listing
      .fetch(listingPublicKey)
      .then((listing) => {
        console.log('Found listing');
        console.log(listing);
        return listing;
      })
      .catch(() => {
        return null;
      });

    if (!listingAcct) throw new Error('Listing does not exist');

    const { tx, signers } = await purchaseListing(
      program as any,
      connection,
      wallet.publicKey,
      {
        account: listingAcct,
        publicKey: listingPublicKey,
      },
      process.env.NODE_ENV === 'development' ? TESTNET : MAINNET
    );

    return { tx, signers };
  };

  return { updateSolDeposit, purchaseListingTransaction };
};

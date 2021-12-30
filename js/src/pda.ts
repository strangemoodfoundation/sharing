import * as anchor from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import { ENV } from './constants';
const { web3 } = anchor;

export const pda = {
  sharing: async (
    depositAccountAddress: PublicKey,
    assetPubkey: PublicKey,
    sharingProgramId?: PublicKey
  ) => {
    console.log(
      'Creating PDA for Program ID: ',
      sharingProgramId ?? ENV.SHARING_PROGRAM_ID
    );
    return web3.PublicKey.findProgramAddress(
      [
        Buffer.from('sharing'),
        assetPubkey.toBuffer(),
        depositAccountAddress.toBuffer(),
      ],
      sharingProgramId ?? ENV.SHARING_PROGRAM_ID
    );
  },
};

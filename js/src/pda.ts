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
    console.log('Creating Sharing PDA for Program ID: ', {
      programId:
        sharingProgramId?.toString() ?? ENV.SHARING_PROGRAM_ID.toString(),
      depositAccountAddress: depositAccountAddress.toString(),
      assetPubkey: assetPubkey.toString(),
    });
    try {
      const result = await web3.PublicKey.findProgramAddress(
        [
          Buffer.from('sharing'),
          assetPubkey.toBuffer(),
          depositAccountAddress.toBuffer(),
        ],
        sharingProgramId ?? ENV.SHARING_PROGRAM_ID
      );
      return result;
    } catch (err) {
      console.error('Could not construct PDA', err);
      return undefined;
    }
  },
};

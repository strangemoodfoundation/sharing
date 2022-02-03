import * as anchor from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
const { web3 } = anchor;

export const pda = {
  authority: async (strangemoodProgramId: PublicKey, escrow: PublicKey) => {
    return web3.PublicKey.findProgramAddress(
      [Buffer.from('authority'), escrow.toBuffer()],
      strangemoodProgramId
    );
  },

  sharing: async (strangemoodProgramId: PublicKey, escrow: PublicKey) => {
    return web3.PublicKey.findProgramAddress(
      [Buffer.from('sharing'), escrow.toBuffer()],
      strangemoodProgramId
    );
  },
};

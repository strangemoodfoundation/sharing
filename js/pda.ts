import * as anchor from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
const { web3 } = anchor;

export const pda = {
  authority: async (programId: PublicKey, escrow: PublicKey) => {
    return web3.PublicKey.findProgramAddress(
      [Buffer.from('authority'), escrow.toBuffer()],
      programId
    );
  },

  sharing: async (programId: PublicKey, escrow: PublicKey) => {
    return web3.PublicKey.findProgramAddress(
      [Buffer.from('sharing'), escrow.toBuffer()],
      programId
    );
  },
};

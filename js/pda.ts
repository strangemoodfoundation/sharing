import * as anchor from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { ENV } from "./constants";
const { web3 } = anchor;

export const pda = {
  sharing: async (
    depositAccountAddress: PublicKey,
    sharingProgramId?: PublicKey
  ) => {
    return web3.PublicKey.findProgramAddress(
      [Buffer.from("sharing"), depositAccountAddress.toBuffer()],
      sharingProgramId ?? ENV.SHARING_PROGRAM_ID
    );
  },
};

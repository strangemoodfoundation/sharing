import * as anchor from '@project-serum/anchor';

export const TESTNET = {
  programId: new anchor.web3.PublicKey(
    'sharYRHd1q5fGpwNecudQrgQT9dT9U22U8Fi2K7VC6y'
  ),
};

export const MAINNET = {
  // incorrect... this is the testnet one.
  programId: new anchor.web3.PublicKey(
    'sharYRHd1q5fGpwNecudQrgQT9dT9U22U8Fi2K7VC6y'
  ),
};

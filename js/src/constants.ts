import * as anchor from '@project-serum/anchor';

export const DEVNET = {
  SHARING_PROGRAM_ID: new anchor.web3.PublicKey(
    '2XTyzP5w7DL5dPD8j2ey7GvJ1FGsVeqmJC9AGwB6xvbb'
  ),
};

export const TESTNET = {
  SHARING_PROGRAM_ID: new anchor.web3.PublicKey(
    '2XTyzP5w7DL5dPD8j2ey7GvJ1FGsVeqmJC9AGwB6xvbb'
  ),
};

export const MAINNET = {
  // incorrect... this is the testnet one.
  SHARING_PROGRAM_ID: new anchor.web3.PublicKey(
    'Hua5xPD28e5ovftEuzmxRwonzYvsNahGyxX8fJs5f1KD'
  ),
};

// Figure out env handling lmao
export const ENV = process.env.NODE_ENV === 'development' ? TESTNET : MAINNET;

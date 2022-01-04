import {
  MAINNET as STRANGE_MAINNET,
  TESTNET as STRANGE_TESTMENT,
} from '@strangemood/strangemood';

export const CLUSTER =
  process.env.NODE_ENV === 'development' ? STRANGE_TESTMENT : STRANGE_MAINNET;

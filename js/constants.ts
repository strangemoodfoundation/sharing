import * as solana from "@solana/web3.js";

export const TESTNET = {
  SHARING_PROGRAM_ID: new solana.PublicKey(
    "Hua5xPD28e5ovftEuzmxRwonzYvsNahGyxX8fJs5f1KD"
  ),
};

export const MAINNET = {
  SHARING_PROGRAM_ID: new solana.PublicKey("TO_DO"),
};


// Figure out env handling lmao
const NET = "testnet";
export const ENV = NET === "testnet" ? TESTNET : MAINNET;

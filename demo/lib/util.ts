import { WalletContextState } from "@solana/wallet-adapter-react";
import { Connection, Signer, Transaction } from "@solana/web3.js";

export const sendAndSign = async (
  connection: Connection,
  wallet: WalletContextState,
  tx: Transaction,
  signers?: Signer[]
) => {
  console.log('TX:', tx);
  const sig = await wallet.sendTransaction(tx, connection, {
    signers,
  });
  console.log('SIG:', sig);

  const confirmation = await connection.confirmTransaction(sig);
  console.log('CONFIRMED TX:', confirmation);

  return { tx, sig, confirmation };
};

import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Sharing } from "../target/types/sharing";

describe("sharing", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.SharingProtocol as Program<Sharing>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.rpc.initSharingAccount({});
    console.log("Your transaction signature", tx);
  });
});

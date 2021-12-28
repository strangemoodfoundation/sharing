import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SharingProtocol } from "../target/types/sharing_protocol";

describe("sharing", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.SharingProtocol as Program<SharingProtocol>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.rpc.initialize({});
    console.log("Your transaction signature", tx);
  });
});

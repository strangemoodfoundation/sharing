const PROGRAM_ID = "Hua5xPD28e5ovftEuzmxRwonzYvsNahGyxX8fJs5f1KD";

// Read the generated IDL.
const idl = JSON.parse(
  require("fs").readFileSync("./target/idl/basic_0.json", "utf8")
);

// Address of the deployed program.
const programId = new anchor.web3.PublicKey(PROGRAM_ID);

// Generate the program client from IDL.
const program = new anchor.Program(idl, programId);

// Execute the RPC.
await program.rpc.initialize();

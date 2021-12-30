## Considerations

Once a listing (or rather, any purchaseable asset) has an affiliate link set up, the destination acct on the listing points at the sharing account's associated wrapped sol account.

If someone purchases without the affiliate-purchase protocol, the money does not get distributed. <<< wowow >>>

## Todo

- [ ] Finish protocol in lib.rs
- [ ] Write JS Client & Publish to NPM
- [ ] Dependency Blocker: @strangemoodfoundation/strangemood needs a way of updating the program.
- [ ] Example Client where we create an affiliate account for a strangemood listing

## Deploying your own:

After including the anchor library, the program public key has this placeholder:
`declare_id!("Hua5xPD28e5ovftEuzmxRwonzYvsNahGyxX8fJs5f1KD");`

That default key is NOT our public key for your build. You need to generate that for your program. We generate it once, and then include it, and can make as many changes as we need to before deploying.

Since that's not our key, let's fix that now and generate our key.

Run:

`anchor build`

As that builds your target folder populates new files.

The newly generated code public key is in that new `./target/deploy folder`. To show our program public key which we will use as our id, run:

`solana address -k ./target/deploy/sharing-keypair.json`

This shows us our unique key:

`Hua5xPD28e5ovftEuzmxRwonzYvsNahGyxX8fJs5f1KD`

_Your key will look different, that's ok. Anchor will generate a unique keypair for everyone, which is how we can uniquely identify our programs from one another._

Copy-and-paste your key and replace that default declare_id placeholder:

`declare_id!("Hua5xPD28e5ovftEuzmxRwonzYvsNahGyxX8fJs5f1KD");`

We will also need to include this same Program ID on the client side.

# TS Template to run Solana scripts

### Usage

1. hit `yarn`
1. write your code inside `index.js` main functoin
1. run the code by running `npm start` or `yarn start`

## Helpers:

### InitializeKeypair

you can find this util inside `src/initializeKeypair.ts`, it will return a
keypair that you can consider as the payer the main feature here is it will save
the keypair in a local `.env` file the first time you run it, so each time you
use it, it will use the same keypair for the payer, also whenever the payer
account runs out of SOL it will airdrop 1 SOL for it automatically

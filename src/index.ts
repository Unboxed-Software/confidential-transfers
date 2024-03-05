import {
  clusterApiUrl,
  Connection,
  Keypair,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  ExtensionType,
  getMintLen,
  TOKEN_2022_PROGRAM_ID,
  MINT_SIZE
} from '@solana/spl-token';
import { initializeKeypair } from './utils/initializeKeypair';
import { createToken22MintWithMetadata } from './utils/utils';
import { createTokenMintWithConfidentialTransfers } from './confidentialTransfer/instruction'

(async () => {})();

async function main() {
  const mintKeypair = Keypair.generate();


  const decimals = 9;

  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

  const payer = await initializeKeypair(connection);

  console.log("Default MINT SIZE: ", MINT_SIZE)
  const metadataExtension = [ExtensionType.MetadataPointer];
  console.log("Metadata Pointer extension size: ", getMintLen(metadataExtension));


  const transactionSignature = await createTokenMintWithConfidentialTransfers(connection, payer, mintKeypair,  decimals, payer.publicKey, payer.publicKey)
  console.log(`Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`);

}

main()
  .then(() => {
    console.log('Finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });

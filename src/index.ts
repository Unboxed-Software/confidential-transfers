import {
  clusterApiUrl,
  Connection,
  Keypair,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  AccountState,
  createAssociatedTokenAccountInstruction,
  createInitializeDefaultAccountStateInstruction,
  createInitializeMintInstruction,
  createMintToCheckedInstruction,
  createUpdateDefaultAccountStateInstruction,
  ExtensionType,
  getAssociatedTokenAddress,
  getMintLen,
  TOKEN_2022_PROGRAM_ID,
  MINT_SIZE
} from '@solana/spl-token';
import { initializeKeypair } from './initializeKeypair';
import { createTokenMintWithConfidentialTransfers, createToken22MintWithMetadata } from './utils';

(async () => {})();

async function main() {
  const mintKeypair = Keypair.generate();


  const decimals = 9;

  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

  const payer = await initializeKeypair(connection);


  const testMintKeypair = Keypair.generate();
  const testMint = testMintKeypair.publicKey;

  const testTx = await createToken22MintWithMetadata(connection, testMintKeypair, payer)
  console.log(`Test Transaction:  https://explorer.solana.com/tx/${testTx}?cluster=devnet`)

  console.log("Default MINT SIZE: ", MINT_SIZE)
  const extensions = [ExtensionType.ConfidentialTransferMint];
  const mintLen = getMintLen(extensions);
  console.log("Confidential transfer size: ", mintLen)


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

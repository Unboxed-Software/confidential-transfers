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
} from '@solana/spl-token';
import { initializeKeypair } from './initializeKeypair';

(async () => {})();

async function main() {
  const mintAuthority = Keypair.generate();
  const freezeAuthority = Keypair.generate();
  const mintKeypair = Keypair.generate();
  const mint = mintKeypair.publicKey;

  const extensions = [ExtensionType.DefaultAccountState];
  const mintLen = getMintLen(extensions);
  const decimals = 9;

  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

  const payer = await initializeKeypair(connection);

  const ata = await getAssociatedTokenAddress(mint, payer.publicKey, false, TOKEN_2022_PROGRAM_ID);

  const defaultState = AccountState.Frozen;

  const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);
  const transaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mint,
      space: mintLen,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeDefaultAccountStateInstruction(mint, defaultState, TOKEN_2022_PROGRAM_ID),
    createInitializeMintInstruction(
      mint,
      decimals,
      mintAuthority.publicKey,
      freezeAuthority.publicKey,
      TOKEN_2022_PROGRAM_ID,
    ),
    createUpdateDefaultAccountStateInstruction(
      mint,
      AccountState.Initialized,
      freezeAuthority.publicKey,
      undefined,
      TOKEN_2022_PROGRAM_ID,
    ),
    createAssociatedTokenAccountInstruction(payer.publicKey, ata, payer.publicKey, mint, TOKEN_2022_PROGRAM_ID),
    createMintToCheckedInstruction(
      mint,
      ata,
      mintAuthority.publicKey,
      10 * (10 ^ decimals),
      decimals,
      undefined,
      TOKEN_2022_PROGRAM_ID,
    ),
  );
  const transactionSignature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [payer, mintKeypair, mintAuthority, freezeAuthority],
    undefined,
  );
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

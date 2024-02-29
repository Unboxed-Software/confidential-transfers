import { 
    AccountState,
    ExtensionType,
    TOKEN_2022_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    createInitializeDefaultAccountStateInstruction,
    createInitializeMetadataPointerInstruction,
    createInitializeMintInstruction,
    getMintLen 
} from "@solana/spl-token";
import { struct, u8 } from '@solana/buffer-layout';
import { bool, publicKey } from '@solana/buffer-layout-utils';

import { 
    Connection,
    Keypair,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction,
    TransactionInstruction,
    PublicKey
} from "@solana/web3.js";

import { TokenUnsupportedInstructionError } from './errors'
import { TokenInstruction } from './instructions/types'

export enum ConfidentialTransferInstruction {
    Initialize = 0,
    Update = 1,
    ConfigureAccount = 2,
    ApproveAccount = 3,
    EmptyAccount = 4,
    Deposit = 5,
    Withdraw = 6,
    Transfer = 7,
    ApplyPendingBalance = 8,
    EnableConfidentialCredits = 9,
    DisableConfidentialCredits = 10,
    EnableNonConfidentialCredits = 11,
    DisableNonConfidentialCredits = 12,
    TransferWithSplitProofs = 13
}

export async function createTokenMintWithConfidentialTransfers(
    connection: Connection, 
    payer: Keypair, 
    mintKeypair: Keypair, 
    decimals: number = 2,
    mintAuthority: PublicKey = payer.publicKey,
    freezeAuthority: PublicKey | null,
): Promise<string> {
    // Define confidential transfer extension for the mint
    const extensions = [ExtensionType.ConfidentialTransferMint];
    // Get the public key of the mint account
    const mintAccount = mintKeypair.publicKey;

    // Calculate the required space for the mint account
    const mintLen = getMintLen(extensions);

    // Get the minimum required lamports for the mint account creation
    const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

    // Create an instruction to create the mint account
    const createAccountInstruction = SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mintAccount,
        space: mintLen,
        lamports,
        programId: TOKEN_2022_PROGRAM_ID,
    });
        
    const initializeConfidentialTransferInstruction = createInitializeConfidentialTransferInstruction(
        mintAccount,
        mintAuthority,
        TOKEN_2022_PROGRAM_ID
    );

    // Initialize instructions
    const initializeMintInstruction = createInitializeMintInstruction(
        mintAccount,
        decimals,
        mintAuthority,
        null,
        TOKEN_2022_PROGRAM_ID
    );

    // Create and send transaction
    const transaction = new Transaction().add(
        createAccountInstruction,
        initializeConfidentialTransferInstruction,
        initializeMintInstruction
    );
    
    return await sendAndConfirmTransaction(
        connection,
        transaction,
        [payer, mintKeypair],
    );
}

/** Check that the token program provided is not `Tokenkeg...`, useful when using extensions */
export function programSupportsExtensions(programId: PublicKey): boolean {
    if (programId === TOKEN_PROGRAM_ID) {
        return false;
    } else {
        return true;
    }
}

export const createInitializeConfidentialTransfer = struct<{
    instruction: TokenInstruction.ConfidentialTransferExtension;
    confidentialTransferInstruction: number;
    authority: PublicKey;
    autoApproveNewAccounts: boolean;
    auditorElGamalPubkey: PublicKey;
}>([
    // prettier-ignore
    u8('instruction'),
    u8('confidentialTransferInstruction'),
    publicKey('authority'),
    bool('autoApproveNewAccounts'),
    publicKey('auditorElGamalPubkey'),
]);

export function createInitializeConfidentialTransferInstruction(
    mint: PublicKey,
    authority: PublicKey,
    programId: PublicKey
): TransactionInstruction {
    if(!programSupportsExtensions(programId)){
        throw new TokenUnsupportedInstructionError()
    }
    
    const keys = [{ pubkey: mint, isSigner: false, isWritable: true }];
    // allocate buffer
    const data = Buffer.alloc(createInitializeConfidentialTransfer.span);
    // serialize data onto struct
    createInitializeConfidentialTransfer.encode(
        {
            instruction: TokenInstruction.ConfidentialTransferExtension,
            confidentialTransferInstruction: ConfidentialTransferInstruction.Initialize,
            authority: authority,
            autoApproveNewAccounts: false,
            auditorElGamalPubkey: authority ?? PublicKey.default
        },
        data
    );

    return new TransactionInstruction({ keys, programId , data: data });
}

export interface MetadataPointer {
    /** Optional authority that can set the metadata address */
    authority: PublicKey | null;
    /** Optional Account Address that holds the metadata */
    metadataAddress: PublicKey | null;
}

export async function createToken22MintWithMetadata(
    connection: Connection,
    mint: Keypair,
    payer: Keypair,

){
    const mintLen = getMintLen([ExtensionType.MetadataPointer]);
    const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

    const createMintAccountInstructions = SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        lamports,
        newAccountPubkey: mint.publicKey,
        programId: TOKEN_2022_PROGRAM_ID,
        space: mintLen,
    });
    
    const initMetadataPointerInstructions = createInitializeMetadataPointerInstruction(
        mint.publicKey, 
        payer.publicKey,
        null,
        TOKEN_2022_PROGRAM_ID,
    );
    
    const initMintInstructions = createInitializeMintInstruction(
        mint.publicKey,
        2,
        payer.publicKey,
        payer.publicKey,
        TOKEN_2022_PROGRAM_ID,
    );

    const transaction = new Transaction().add(
        createMintAccountInstructions,
        initMetadataPointerInstructions,
        initMintInstructions,
    );
    
    return await sendAndConfirmTransaction(connection, transaction, [payer, mint]);
}
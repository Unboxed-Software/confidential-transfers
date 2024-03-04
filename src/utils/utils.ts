import { 
    ExtensionType,
    TOKEN_2022_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    createInitializeMetadataPointerInstruction,
    createInitializeMintInstruction,
    getMintLen,
} from "@solana/spl-token";

import { 
    Connection,
    Keypair,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction,
    PublicKey,
} from "@solana/web3.js";

/** Check that the token program provided is not `Tokenkeg...`, useful when using extensions */
export function programSupportsExtensions(programId: PublicKey): boolean {
    if (programId === TOKEN_PROGRAM_ID) {
        return false;
    } else {
        return true;
    }
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
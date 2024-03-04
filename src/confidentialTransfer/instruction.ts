import { 
    ExtensionType,
    TOKEN_2022_PROGRAM_ID,
    createInitializeMintInstruction,
    getMintLen,
    MINT_SIZE
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
    PublicKey,
} from "@solana/web3.js";

import { TokenUnsupportedInstructionError } from '../utils/errors'
import { TokenInstruction } from '../tokenExtensionInstructions/types'
import { CONFIDENTIAL_TRANSFER_SIZE } from './state'
import { programSupportsExtensions } from '../utils/utils'

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

export interface InitializeConfidentialTransferInstructionData {
    instruction: TokenInstruction.ConfidentialTransferExtension;
    confidentialTransferInstruction: ConfidentialTransferInstruction.Initialize;
    authority: PublicKey | null;
    autoApproveNewAccounts: boolean;
    auditorElGamalPubkey: PublicKey | null;
}

export const initializeConfidentialTransferInstructionData = struct<InitializeConfidentialTransferInstructionData>([
    // prettier-ignore
    u8('instruction'),
    u8('confidentialTransferInstruction'),
    publicKey('authority'),
    bool('autoApproveNewAccounts'),
    publicKey('auditorElGamalPubkey'),
]);

/**
 * Construct an InitializeConfidentialTransfer instruction
 *
 * @param mint            Token mint account
 * @param authority  Optional authority of the mint
 * @param programId       SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createInitializeConfidentialTransferInstruction(
    mint: PublicKey,
    authority: PublicKey | null,
    programId: PublicKey
): TransactionInstruction {
    if(!programSupportsExtensions(programId)){
        throw new TokenUnsupportedInstructionError()
    }
    
    const keys = [{ pubkey: mint, isSigner: false, isWritable: true }];
    // allocate buffer
    const data = Buffer.alloc(initializeConfidentialTransferInstructionData.span);
    // serialize data onto struct
    initializeConfidentialTransferInstructionData.encode(
        {
            instruction: TokenInstruction.ConfidentialTransferExtension,
            confidentialTransferInstruction: ConfidentialTransferInstruction.Initialize,
            authority: authority,
            autoApproveNewAccounts: true,
            auditorElGamalPubkey: authority
        },
        data
    );

    return new TransactionInstruction({ keys, programId , data: data });
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
    console.log("Confidential transfer size from solana/web3.js: ", mintLen)

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
        //initializeMintInstruction
    );
    
    return await sendAndConfirmTransaction(
        connection,
        transaction,
        [payer, mintKeypair],
    );
}
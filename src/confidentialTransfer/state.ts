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

/** MetadataPointer as stored by the program */
export interface ConfidentialTransferState {
    /** Optional authority*/
    authority: PublicKey | null;
    autoApproveNewAccounts: boolean;
    /** Optional Account Address of the El Gamal Auditor */
    auditorElgamalPubkey: PublicKey | null;
}

/** Buffer layout for de/serializing a Metadata Pointer extension */
export const ConfidentialTransferLayout = struct<{ authority: PublicKey; autoApproveNewAccounts: boolean; auditorElgamalPubkey: PublicKey }>([
    publicKey('authority'),
    bool('autoApproveNewAccounts'),
    publicKey('auditorElgamalPubkey'),
]);

export const CONFIDENTIAL_TRANSFER_SIZE = ConfidentialTransferLayout.span;
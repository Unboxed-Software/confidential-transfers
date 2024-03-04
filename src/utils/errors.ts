/** Base class for errors */
export abstract class TokenError extends Error {
    constructor(message?: string) {
        super(message);
    }
}

/** Thrown if the program does not support the desired instruction */
export class TokenUnsupportedInstructionError extends TokenError {
    name = 'TokenUnsupportedInstructionError';
}
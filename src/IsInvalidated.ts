export type IsInvalidated = IsInvalidated.IsValid | IsInvalidated.RetryIn;

export namespace IsInvalidated {
    export type IsValid = Valid | Invalid;

    export interface Valid {
        type: 'valid';
    }
    export const Valid: Valid = { type: 'valid' };

    export interface Invalid {
        type: 'invalid';
    }
    export const Invalid: Invalid = { type: 'invalid' };

    export interface RetryIn {
        type: 'retry-in';
        current: IsValid;
        millis: number;
    }
    export const RefetchAfter = (current: IsValid, millis: number): RetryIn => ({
        type: 'retry-in',
        current,
        millis,
    });
}

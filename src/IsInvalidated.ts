export type IsInvalidated = IsInvalidated.IsValid | IsInvalidated.RetryIn;

export namespace IsInvalidated {
    export const isValid = (x: IsInvalidated): boolean => {
        switch (x.type) {
            case 'valid':
                return true;
            case 'invalid':
                return false;
            case 'retry-in':
                return isValid(x.current);
        }
    };

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

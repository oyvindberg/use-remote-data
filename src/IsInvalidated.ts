export type IsInvalidated = IsInvalidated.Valid | IsInvalidated.InvalidateIn | IsInvalidated.Invalidated;

export namespace IsInvalidated {
    export interface Valid {
        type: 'valid';
    }
    export const Valid: Valid = { type: 'valid' };

    export interface InvalidateIn {
        type: 'invalidate-in';
        millis: number;
    }
    export const InvalidateIn = (millis: number): InvalidateIn => ({ type: 'invalidate-in', millis });

    export interface Invalidated {
        type: 'invalidated';
    }
    export const Invalidated: Invalidated = { type: 'invalidated' };
}

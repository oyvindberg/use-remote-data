import { IsInvalidated } from './IsInvalidated';

/**
 * You can plug in your own ways of determining if a piece of data is outdated.
 *
 * Note that the strategy should be a pure function, that is subsequent invocations with same parameters should return same value
 */
export interface InvalidationStrategy<T> {
    decide: (value: T, fetchedAt: Date, now: Date) => IsInvalidated;
}

export namespace InvalidationStrategy {
    export const of = <T>(
        decide: (value: T, fetchedAt: Date, now: Date) => IsInvalidated
    ): InvalidationStrategy<T> => ({ decide });

    /* no invalidation needed */
    export const alwaysValid = <T>(): InvalidationStrategy<T> => of(() => IsInvalidated.Valid);

    /* Use this to consider the fetched value when deciding if it should be fetched again */
    export const pollUntil = <T>(isValid: (value: T) => boolean, waitMillis: number): InvalidationStrategy<T> =>
        of<T>((value, fetchedAt, now) => {
            if (isValid(value)) {
                return IsInvalidated.Valid;
            }

            const retryIn = Math.max(fetchedAt.getTime() + waitMillis - now.getTime(), 1);
            return IsInvalidated.InvalidateIn(retryIn);
        });

    /* always fetch value again after some time */
    export const refetchAfterMillis = <T>(validMillis: number): InvalidationStrategy<T> =>
        of<unknown>((_, fetchedAt, now) => {
            const remainingMs = fetchedAt.getTime() + validMillis - now.getTime();
            if (remainingMs <= 0) {
                return IsInvalidated.Invalidated;
            }
            return IsInvalidated.InvalidateIn(remainingMs + 1);
        });
}

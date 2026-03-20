import { Staleness } from './Staleness';

export interface RefreshStrategy<T> {
    decide: (value: T, fetchedAt: Date, now: Date) => Staleness;
}

export namespace RefreshStrategy {
    export const of = <T>(
        decide: (value: T, fetchedAt: Date, now: Date) => Staleness
    ): RefreshStrategy<T> => ({ decide });

    export const alwaysFresh = <T>(): RefreshStrategy<T> => of(() => Staleness.Fresh);

    export const pollUntil = <T>(isValid: (value: T) => boolean, waitMillis: number): RefreshStrategy<T> =>
        of<T>((value, fetchedAt, now) => {
            if (isValid(value)) {
                return Staleness.Fresh;
            }
            const retryIn = Math.max(fetchedAt.getTime() + waitMillis - now.getTime(), 1);
            return Staleness.CheckAfter(Staleness.Stale, retryIn);
        });

    export const afterMillis = <T>(validMillis: number): RefreshStrategy<T> =>
        of<T>((_, fetchedAt, now) => {
            const remainingMs = fetchedAt.getTime() + validMillis - now.getTime();
            if (remainingMs <= 0) {
                return Staleness.Stale;
            }
            return Staleness.CheckAfter(Staleness.Fresh, remainingMs + 1);
        });
}

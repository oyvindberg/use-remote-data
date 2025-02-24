import { isDefined } from './internal/isDefined';
import { WeakError } from './WeakError';
import { Either } from './Either';

export type RemoteData<T, E = never> =
    | RemoteData.Initial
    | RemoteData.Pending
    | RemoteData.No<E>
    | RemoteData.Yes<T>
    | RemoteData.InvalidatedImmediate<T>
    | RemoteData.InvalidatedInitial<T>
    | RemoteData.InvalidatedPending<T>;

export namespace RemoteData {
    export const Epoch = new Date(0);

    export const Initial: Initial = { type: 'initial' };

    export interface Initial {
        readonly type: 'initial';
    }

    export const Pending: Pending = { type: 'pending' };

    export interface Pending {
        readonly type: 'pending';
    }

    export const No = <E>(errors: readonly Either<WeakError, E>[], retry: () => Promise<void>): No<E> => ({
        type: 'no',
        errors,
        retry,
    });

    export interface No<E> {
        readonly type: 'no';
        readonly errors: readonly Either<WeakError, E>[];
        readonly retry: () => Promise<void>;
    }

    export const Yes = <T>(value: T, updatedAt: Date): Yes<T> => ({ type: 'yes', value, updatedAt });

    export interface Yes<T> {
        readonly type: 'yes';
        readonly value: T;
        readonly updatedAt: Date;
    }

    export const InvalidatedImmediate = <T>(invalidated: RemoteData.Yes<T>): InvalidatedImmediate<T> => ({
        type: 'invalidated-immediate',
        invalidated,
    });

    export interface InvalidatedImmediate<T> {
        readonly type: 'invalidated-immediate';
        readonly invalidated: RemoteData.Yes<T>;
    }

    export const InvalidatedInitial = <T>(invalidated: RemoteData.Yes<T>): InvalidatedInitial<T> => ({
        type: 'invalidated-initial',
        invalidated,
    });

    export interface InvalidatedInitial<T> {
        readonly type: 'invalidated-initial';
        readonly invalidated: RemoteData.Yes<T>;
    }

    export const InvalidatedPending = <T>(invalidated: RemoteData.Yes<T>): InvalidatedPending<T> => ({
        type: 'invalidated-pending',
        invalidated,
    });

    export interface InvalidatedPending<T> {
        readonly type: 'invalidated-pending';
        readonly invalidated: RemoteData.Yes<T>;
    }

    export type ValuesFrom<Datas extends RemoteData<unknown, unknown>[]> = {
        [I in keyof Datas]: Datas[I] extends RemoteData<infer O, unknown> ? O : never;
    };

    export type ErrorsFromArray<Datas extends RemoteData<unknown, unknown>[]> = {
        [I in keyof Datas]: Datas[I] extends RemoteData.No<infer E> ? E : never;
    };

    export type ErrorsFrom<Datas extends RemoteData<unknown, unknown>[]> = ErrorsFromArray<Datas>[number];

    // combine many RemoteData values into one with a tuple with all values if we have them.
    // think of this as `sequence` from FP
    export const all = <RemoteDatas extends RemoteData<unknown, unknown>[]>(
        ...remoteDatas: RemoteDatas
    ): RemoteData<ValuesFrom<RemoteDatas>, ErrorsFrom<RemoteDatas>> => {
        // state-of-the-art typescript: typed on the outside, untyped on the inside
        const ret: unknown[] = [];
        let updatedAt: Date = Epoch;
        let isInvalidated = false;
        let foundNo: RemoteData.No<unknown>[] = [];
        let foundPending: RemoteData.Pending | undefined = undefined;
        let foundInitial: RemoteData.Initial | undefined = undefined;

        for (const remoteData of remoteDatas) {
            switch (remoteData.type) {
                case 'yes':
                    if (remoteData.updatedAt > updatedAt) {
                        updatedAt = remoteData.updatedAt;
                    }
                    ret.push(remoteData.value);
                    break;
                case 'invalidated-initial':
                case 'invalidated-pending':
                    isInvalidated = true;
                    if (remoteData.invalidated.updatedAt > updatedAt) {
                        updatedAt = remoteData.invalidated.updatedAt;
                    }
                    ret.push(remoteData.invalidated.value);
                    break;
                case 'initial':
                    foundInitial = remoteData;
                    break;
                case 'no':
                    foundNo.push(remoteData);
                    break;
                case 'pending':
                    foundPending = remoteData;
                    break;
            }
        }

        if (foundNo.length > 0) {
            const retry = () => Promise.all(foundNo.map((no) => no.retry())).then(() => {});
            const allErrors = foundNo.reduce<readonly Either<WeakError, unknown>[]>(
                (acc, no) => [...acc, ...no.errors],
                []
            );
            return RemoteData.No(allErrors as Either<WeakError, ErrorsFrom<RemoteDatas>>[], retry);
        } else if (isDefined(foundPending)) {
            return foundPending;
        } else if (isDefined(foundInitial)) {
            return foundInitial;
        }

        const combined = RemoteData.Yes(ret as ValuesFrom<RemoteDatas>, updatedAt);

        if (isInvalidated) return RemoteData.InvalidatedPending(combined);
        else return combined;
    };

    export const orNull = <T, E>(remoteData: RemoteData<T, E>): [T, Date] | null =>
        fold(remoteData)(
            (value, _, updatedAt) => [value, updatedAt],
            () => null,
            (_) => null
        );

    /**
     * Given a `RemoteData`, reduce all the possible cases to one.
     */
    export const fold =
        <T, E>(remoteData: RemoteData<T, E>) =>
        <Out>(
            onData: (value: T, isInvalidated: boolean, updatedAt: Date) => Out,
            onEmpty: () => Out,
            onFailed: (err: readonly Either<WeakError, E>[], retry: () => Promise<void>) => Out
        ): Out => {
            switch (remoteData.type) {
                case 'initial':
                case 'pending':
                    return onEmpty();

                case 'yes':
                    return onData(remoteData.value, false, remoteData.updatedAt);

                case 'no':
                    return onFailed(remoteData.errors, remoteData.retry);

                case 'invalidated-immediate':
                case 'invalidated-initial':
                case 'invalidated-pending':
                    return onData(remoteData.invalidated.value, true, remoteData.invalidated.updatedAt);
            }
        };

    export const pendingStateFor = <T, E>(remoteData: RemoteData<T, E>): RemoteData<T, E> => {
        switch (remoteData.type) {
            case 'invalidated-initial':
                return RemoteData.InvalidatedPending(remoteData.invalidated);
            case 'yes':
                return RemoteData.InvalidatedPending(remoteData);
            default:
                return RemoteData.Pending;
        }
    };

    export const initialStateFor = <T, E>(remoteData: RemoteData<T, E>): RemoteData<T, E> => {
        switch (remoteData.type) {
            case 'yes':
                return RemoteData.InvalidatedInitial(remoteData);
            default:
                return RemoteData.Initial;
        }
    };

    export const map = <T, U, E>(remoteData: RemoteData<T, E>, f: (t: T) => U): RemoteData<U, E> => {
        switch (remoteData.type) {
            case 'initial':
                return RemoteData.Initial;
            case 'pending':
                return RemoteData.Pending;
            case 'no':
                return RemoteData.No(remoteData.errors, remoteData.retry);
            case 'yes':
                return RemoteData.Yes(f(remoteData.value), remoteData.updatedAt);
            case 'invalidated-immediate': {
                const yes = RemoteData.Yes(f(remoteData.invalidated.value), remoteData.invalidated.updatedAt);
                return RemoteData.InvalidatedImmediate(yes);
            }
            case 'invalidated-initial': {
                const yes = RemoteData.Yes(f(remoteData.invalidated.value), remoteData.invalidated.updatedAt);
                return RemoteData.InvalidatedInitial(yes);
            }
            case 'invalidated-pending': {
                const yes = RemoteData.Yes(f(remoteData.invalidated.value), remoteData.invalidated.updatedAt);
                return RemoteData.InvalidatedPending(yes);
            }
        }
    };
}

import { isDefined } from './internal/isDefined';

export type RemoteData<T> =
    | RemoteData.Initial
    | RemoteData.Pending
    | RemoteData.No
    | RemoteData.Yes<T>
    | RemoteData.InvalidatedInitial<T>
    | RemoteData.InvalidatedPending<T>;

export namespace RemoteData {
    // unfortunately you can fail a `Promise` with anything. It's often an `Error`, though
    export type WeakError = Error | unknown;

    export const Initial: Initial = { type: 'initial' };

    export interface Initial {
        readonly type: 'initial';
    }

    export const Pending: Pending = { type: 'pending' };

    export interface Pending {
        readonly type: 'pending';
    }

    export const No = (errors: ReadonlyArray<WeakError>, retry: () => Promise<void>): No => ({
        type: 'no',
        errors,
        retry,
    });

    export interface No {
        readonly type: 'no';
        readonly errors: ReadonlyArray<WeakError>;
        readonly retry: () => Promise<void>;
    }

    export const Yes = <T>(value: T): Yes<T> => ({ type: 'yes', value });

    export interface Yes<T> {
        readonly type: 'yes';
        readonly value: T;
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

    export type ValuesFrom<Datas extends [...RemoteData<unknown>[]]> = {
        [I in keyof Datas]: Datas[I] extends RemoteData<infer O> ? O : never;
    };

    // combine many RemoteData values into one with a tuple with all values if we have them.
    // think of this as `sequence` from FP
    export const all = <RemoteDatas extends RemoteData<unknown>[]>(
        ...remoteDatas: RemoteDatas
    ): RemoteData<ValuesFrom<RemoteDatas>> => {
        // state of the art typescript: typed on the outside, untyped on the inside
        const ret: unknown[] = [];
        let isInvalidated = false;
        let foundNo: RemoteData.No[] = [];
        let foundPending: RemoteData.Pending | undefined = undefined;
        let foundInitial: RemoteData.Initial | undefined = undefined;

        for (const remoteData of remoteDatas) {
            switch (remoteData.type) {
                case 'yes':
                    ret.push(remoteData.value);
                    break;
                case 'invalidated-initial':
                    isInvalidated = true;
                    ret.push(remoteData.invalidated.value);
                    break;
                case 'invalidated-pending':
                    isInvalidated = true;
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
            const allErrors = foundNo.reduce<readonly WeakError[]>((acc, no) => [...acc, ...no.errors], []);
            return RemoteData.No(allErrors, retry);
        } else if (isDefined(foundPending)) {
            return foundPending;
        } else if (isDefined(foundInitial)) {
            return foundInitial;
        }

        const combined = RemoteData.Yes(ret as ValuesFrom<RemoteDatas>);

        if (isInvalidated) return RemoteData.InvalidatedPending(combined);
        else return combined;
    };

    export const orNull = <T>(remoteData: RemoteData<T>): T | null =>
        fold(remoteData)(
            (value) => value,
            () => null,
            (_) => null
        );

    /**
     * Given a `RemoteData`, reduce all the possible cases to one.
     */
    export const fold =
        <T>(remoteData: RemoteData<T>) =>
        <Out>(
            onData: (value: T, isInvalidated: boolean) => Out,
            onEmpty: () => Out,
            onFailed: (err: ReadonlyArray<WeakError>, retry: () => Promise<void>) => Out
        ) => {
            switch (remoteData.type) {
                case 'initial':
                    return onEmpty();

                case 'pending':
                    return onEmpty();

                case 'yes':
                    return onData(remoteData.value, false);

                case 'no':
                    return onFailed(remoteData.errors, remoteData.retry);

                case 'invalidated-initial':
                    return onData(remoteData.invalidated.value, true);

                case 'invalidated-pending':
                    return onData(remoteData.invalidated.value, true);
            }
        };

    export const pendingStateFor = <T>(remoteData: RemoteData<T>): RemoteData<T> => {
        switch (remoteData.type) {
            case 'invalidated-initial':
                return RemoteData.InvalidatedPending(remoteData.invalidated);
            case 'yes':
                return RemoteData.InvalidatedPending(remoteData);
            default:
                return RemoteData.Pending;
        }
    };

    export const initialStateFor = <T>(remoteData: RemoteData<T>): RemoteData<T> => {
        switch (remoteData.type) {
            case 'yes':
                return RemoteData.InvalidatedInitial(remoteData);
            default:
                return RemoteData.Initial;
        }
    };

    export const map = <T, U>(remoteData: RemoteData<T>, f: (t: T) => U): RemoteData<U> => {
        switch (remoteData.type) {
            case 'initial':
                return RemoteData.Initial;
            case 'pending':
                return RemoteData.Pending;
            case 'no':
                return RemoteData.No(remoteData.errors, remoteData.retry);
            case 'yes':
                return RemoteData.Yes(f(remoteData.value));
            case 'invalidated-initial':
                return RemoteData.InvalidatedInitial(RemoteData.Yes(f(remoteData.invalidated.value)));
            case 'invalidated-pending':
                return RemoteData.InvalidatedPending(RemoteData.Yes(f(remoteData.invalidated.value)));
        }
    }
}

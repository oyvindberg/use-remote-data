export type RemoteData<T> =
    | RemoteData.Initial
    | RemoteData.Pending
    | RemoteData.No
    | RemoteData.Yes<T>
    | RemoteData.InvalidatedInitial<T>
    | RemoteData.InvalidatedPending<T>;

export namespace RemoteData {
    export const Initial: Initial = { type: 'initial' };

    export interface Initial {
        readonly type: 'initial';
    }

    export const Pending: Pending = { type: 'pending' };

    export interface Pending {
        readonly type: 'pending';
    }

    export const No = (error: Error | unknown, retry: () => Promise<void>): No => ({ type: 'no', error, retry });

    export interface No {
        readonly type: 'no';
        readonly error: Error | unknown;
        readonly retry: () => Promise<void>;
    }

    export const Yes = <T>(value: T): Yes<T> => ({ type: 'yes', value });

    export interface Yes<T> {
        readonly type: 'yes';
        readonly value: T;
    }

    export const InvalidatedInitial = <T>(invalidated: RemoteData<T>): InvalidatedInitial<T> => ({
        type: 'invalidated-initial',
        invalidated,
    });

    export interface InvalidatedInitial<T> {
        readonly type: 'invalidated-initial';
        readonly invalidated: RemoteData<T>;
    }

    export const InvalidatedPending = <T>(invalidated: RemoteData<T>): InvalidatedPending<T> => ({
        type: 'invalidated-pending',
        invalidated,
    });

    export interface InvalidatedPending<T> {
        readonly type: 'invalidated-pending';
        readonly invalidated: RemoteData<T>;
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

        const accumulateAndValidate = (remoteData: RemoteData<unknown>): boolean => {
            switch (remoteData.type) {
                case 'yes':
                    ret.push(remoteData.value);
                    return true;
                case 'invalidated-initial':
                    isInvalidated = true;
                    return accumulateAndValidate(remoteData.invalidated);
                case 'invalidated-pending':
                    isInvalidated = true;
                    return accumulateAndValidate(remoteData.invalidated);
                default:
                    return false;
            }
        };

        for (const remoteData of remoteDatas) {
            if (!accumulateAndValidate(remoteData)) {
                return remoteData as RemoteData<ValuesFrom<RemoteDatas>>;
            }
        }

        const combined = RemoteData.Yes(ret as ValuesFrom<RemoteDatas>);

        if (isInvalidated) return RemoteData.InvalidatedPending(combined);
        else return combined;
    };

    /**
     * Given a `RemoteData`, reduce all the possible cases to one.
     */
    export const fold =
        <T>(remoteData: RemoteData<T>) =>
        <Out>(
            onData: (value: T, isInvalidated: boolean) => Out,
            onEmpty: () => Out,
            onFailed: (err: Error | unknown, retry: () => Promise<void>) => Out
        ) => {
            const recurse = (data: RemoteData<T>, isInvalidated: boolean): Out => {
                switch (data.type) {
                    case 'initial':
                        return onEmpty();

                    case 'pending':
                        return onEmpty();

                    case 'yes':
                        return onData(data.value, isInvalidated);

                    case 'no':
                        return onFailed(data.error, data.retry);

                    case 'invalidated-initial':
                        return recurse(data.invalidated, true);

                    case 'invalidated-pending':
                        return recurse(data.invalidated, true);
                }
            };

            return recurse(remoteData, false);
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
}

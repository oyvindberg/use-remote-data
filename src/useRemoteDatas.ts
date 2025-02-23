import { useEffect, useState, version } from 'react';
import { isDefined } from './internal/isDefined';
import { JsonKey } from './internal/JsonKey';
import { MaybeCancel } from './internal/MaybeCancel';
import { RemoteData } from './RemoteData';
import { RemoteDataStore } from './RemoteDataStore';
import { RemoteDataStores } from './RemoteDataStores';
import { Options } from './Options';
import { IsInvalidated } from './IsInvalidated';

const reactMajor = Number(version.split('.')[0]);

export const useRemoteDatas = <K, V>(run: (key: K) => Promise<V>, options: Options<V> = {}): RemoteDataStores<K, V> => {
    const [remoteDatas, setRemoteDatas] = useState<ReadonlyMap<JsonKey<K>, RemoteData<V>>>(new Map());
    const [deps, setDeps] = useState(JsonKey.of(options.dependencies));

    const storeName = (key: JsonKey<K> | undefined) => {
        if (isDefined(options.storeName)) {
            if (isDefined(key)) {
                return `${options.storeName}(${key})`;
            }
            return options.storeName;
        }
        return;
    };

    // for react 17: we're not allowed to update state after unmount
    // for react 18: the unmounting happens immediately, but we're allowed to update whenever
    let canUpdate = true;
    if (reactMajor < 18) {
        useEffect(
            () => () => {
                if (options.debug) {
                    options.debug(`${storeName(undefined)} unmounting`);
                }
                canUpdate = false;
            },
            []
        );
    }

    const set = (key: JsonKey<K>, data: RemoteData<V>): void => {
        if (canUpdate) {
            if (options.debug) {
                options.debug(`${storeName(key)} => `, data);
            }

            setRemoteDatas((oldRemoteDatas) => {
                const newRemoteDatas = new Map(oldRemoteDatas);
                newRemoteDatas.set(key, data);
                return newRemoteDatas;
            });
        } else if (options.debug) {
            options.debug(`${storeName(key)} dropped update because component has been unmounted`, data);
        }
    };

    const runAndUpdate = (key: K, jsonKey: JsonKey<K>, pendingState: RemoteData<V>): Promise<void> => {
        set(jsonKey, pendingState);
        try {
            return run(key)
                .then((value) => {
                    const now = new Date();
                    let res: RemoteData<V> = RemoteData.Yes(value, now);
                    if (
                        options.invalidation &&
                        !IsInvalidated.isValid(options.invalidation.decide(res.value, res.updatedAt, now))
                    ) {
                        res = RemoteData.InvalidatedImmediate(res);
                    }

                    set(jsonKey, res);
                })
                .catch((error) =>
                    set(
                        jsonKey,
                        RemoteData.No([error], () => runAndUpdate(key, jsonKey, RemoteData.Pending))
                    )
                );
        } catch (error) {
            set(jsonKey, RemoteData.No([error], () => runAndUpdate(key, jsonKey, RemoteData.Pending)));
            return Promise.resolve();
        }
    };

    // only allow first update each pass in case the store is shared
    const isUpdating: Map<JsonKey<K>, boolean> = new Map();

    /**
     * This is where we trigger all progress. It is initiated by client components at render-time within a `setEffect`.
     *
     * The actual data update (ultimately through `set`) is done
     * - inline in this function
     * - performed at the completion of a `Promise`
     * - or after a `setTimeout`
     *
     * A `MaybeCancel` data structure is returned with enough information to cancel timeouts on unmount,
     *  and to wait to completion of `Promise` (for tests, for now at least)
     */
    const triggerUpdate = (key: K, jsonKey: JsonKey<K>): MaybeCancel => {
        /** step one: if dependencies have changed, invalidate all data */
        const currentDeps = JsonKey.of(options.dependencies);
        if (deps !== currentDeps) {
            if (options.debug) {
                options.debug(`${storeName(jsonKey)} invalidating due to deps, from/to:`, deps, currentDeps);
            }
            setDeps(currentDeps);

            const invalidatedRemoteDatas = new Map<JsonKey<K>, RemoteData<V>>();
            remoteDatas.forEach((remoteData, key) =>
                invalidatedRemoteDatas.set(key, RemoteData.initialStateFor(remoteData))
            );
            setRemoteDatas(invalidatedRemoteDatas);

            return;
        }

        /** step two: if we're already updating, do nothing */
        if (isUpdating.get(jsonKey)) {
            return;
        }
        isUpdating.set(jsonKey, true);

        /** step three: if we're in an initial state, start data fetching in the background */
        const remoteData = remoteDatas.get(jsonKey) || RemoteData.Initial;

        if (remoteData.type === 'initial' || remoteData.type === 'invalidated-initial') {
            // note that we let the `Promise` fly here, we don't have a way of cancelling that.
            runAndUpdate(key, jsonKey, RemoteData.pendingStateFor(remoteData));
            return;
        }

        /** step four: invalidation logic (if enabled in `options.invalidation`) */
        if (
            isDefined(options.invalidation) &&
            (remoteData.type === 'yes' || remoteData.type === 'invalidated-immediate')
        ) {
            const yes = remoteData.type === 'yes' ? remoteData : remoteData.invalidated;
            const isInvalidated = options.invalidation.decide(yes.value, yes.updatedAt, new Date());

            switch (isInvalidated.type) {
                case 'invalid':
                    set(jsonKey, RemoteData.InvalidatedInitial(yes));
                    return;
                case 'valid':
                    return;
                case 'retry-in':
                    if (options.debug) {
                        options.debug(`${storeName(jsonKey)}: will invalidate in ${isInvalidated.millis}`);
                    }

                    const handle = setTimeout(
                        () => set(jsonKey, RemoteData.InvalidatedInitial(yes)),
                        isInvalidated.millis
                    );
                    return () => {
                        if (options.debug) {
                            options.debug(`${storeName(jsonKey)}: cancelled invalidation on unmount`);
                        }
                        clearTimeout(handle);
                    };
            }
        }
    };

    const get = (key: K): RemoteDataStore<V> => {
        const jsonKey = JsonKey.of(key);

        return {
            storeName: storeName(jsonKey),
            get current() {
                return remoteDatas.get(jsonKey) || RemoteData.Initial;
            },
            invalidate: () => {
                set(jsonKey, RemoteData.initialStateFor(remoteDatas.get(jsonKey) || RemoteData.Initial));
            },
            triggerUpdate: () => triggerUpdate(key, jsonKey),
            get orNull(): RemoteDataStore<V | null> {
                return RemoteDataStore.orNull(this);
            },
            map<U>(fn: (value: V) => U): RemoteDataStore<U> {
                return RemoteDataStore.map(this, fn);
            },
        };
    };

    return {
        get,
        getMany: (keys: readonly K[]): readonly RemoteDataStore<V>[] => keys.map(get),
    };
};

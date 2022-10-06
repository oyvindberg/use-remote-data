import { useEffect, useState, version } from 'react';
import { isDefined } from './internal/isDefined';
import { JsonKey } from './internal/JsonKey';
import { MaybeCancel } from './internal/MaybeCancel';
import { RemoteData } from './RemoteData';
import { RemoteDataStore } from './RemoteDataStore';
import { RemoteDataStores } from './RemoteDataStores';
import { Options } from './Options';

const reactMajor = Number(version.split('.')[0]);

export const useRemoteDatas = <K, V>(run: (key: K) => Promise<V>, options: Options = {}): RemoteDataStores<K, V> => {
    // current `RemoteData` state
    const [remoteDatas, setRemoteDatas] = useState<ReadonlyMap<JsonKey<K>, RemoteData<V>>>(new Map());
    // used for invalidation. only update this when receiving new data
    const [fetchedAts, setFetchedAts] = useState<ReadonlyMap<JsonKey<K>, Date>>(new Map());
    const [deps, setDeps] = useState(options.dependencies);

    const storeName = (key: JsonKey<K> | undefined) => {
        if (isDefined(options.storeName)) {
            if (key !== undefined) {
                return `${options.storeName}(${key})`;
            }
            return options.storeName;
        }
        return undefined;
    };

    // for react 17: we're not allowed to update state after unmount
    // for react 18: the unmounting happens immediately, but we're allowed to update whenever
    let canUpdate = true;
    if (reactMajor < 18) {
        useEffect(
            () => () => {
                if (options.debug) {
                    console.warn(`${storeName(undefined)} unmounting`);
                }
                canUpdate = false;
            },
            []
        );
    }

    const set = (key: JsonKey<K>, data: RemoteData<V>, fetchedAt?: Date): void => {
        if (canUpdate) {
            if (options.debug) {
                console.warn(`${storeName(key)} => `, data, fetchedAt);
            }

            // keep before setRemoteData to not trigger unnecessary invalidations
            if (isDefined(fetchedAt)) {
                setFetchedAts((oldFetchedAts) => {
                    const newFetchedAts = new Map(oldFetchedAts);
                    newFetchedAts.set(key, fetchedAt);
                    return newFetchedAts;
                });
            }

            setRemoteDatas((oldRemoteDatas) => {
                const newRemoteDatas = new Map(oldRemoteDatas);
                newRemoteDatas.set(key, data);
                return newRemoteDatas;
            });
        } else if (options.debug) {
            console.warn(`${storeName(key)} dropped update because component has been unmounted`, data, fetchedAt);
        }
    };

    const runAndUpdate = (key: K, jsonKey: JsonKey<K>, pendingState: RemoteData<V>): Promise<void> => {
        set(jsonKey, pendingState);
        return run(key)
            .then((value) => set(jsonKey, RemoteData.Yes(value), new Date()))
            .catch((error) =>
                set(
                    jsonKey,
                    RemoteData.No([error], () => runAndUpdate(key, jsonKey, RemoteData.Pending))
                )
            );
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
        // invalidate all on dependency change
        if (JsonKey.of(deps) !== JsonKey.of(options.dependencies)) {
            if (options.debug) {
                console.warn(`${storeName(jsonKey)} invalidating due to deps, from/to:`, deps, options.dependencies);
            }
            setDeps(options.dependencies);

            const invalidatedRemoteDatas = new Map<JsonKey<K>, RemoteData<V>>();
            remoteDatas.forEach((remoteData, key) =>
                invalidatedRemoteDatas.set(key, RemoteData.initialStateFor(remoteData))
            );
            setRemoteDatas(invalidatedRemoteDatas);

            return undefined;
        }

        if (isUpdating.get(jsonKey)) {
            return undefined;
        }
        isUpdating.set(jsonKey, true);

        const remoteData = remoteDatas.get(jsonKey) || RemoteData.Initial;

        if (remoteData.type === 'initial' || remoteData.type === 'invalidated-initial') {
            // note that we let the `Promise` fly here, we don't have a way of cancelling that.
            runAndUpdate(key, jsonKey, RemoteData.pendingStateFor(remoteData));
            return undefined;
        }

        const fetchedAt = fetchedAts.get(jsonKey);

        // non-dependency invalidation logic. only enabled if requested in `options.ttlMillis` and if we have data to invalidate
        if (isDefined(options.ttlMillis) && remoteData.type === 'yes' && isDefined(fetchedAt)) {
            const remainingMs = fetchedAt.getTime() + options.ttlMillis - new Date().getTime();

            if (remainingMs <= 0) {
                set(jsonKey, RemoteData.InvalidatedInitial(remoteData));
            } else {
                if (options.debug) {
                    console.warn(`${storeName(jsonKey)}: will invalidate in ${remainingMs}`);
                }

                const handle = setTimeout(
                    () => set(jsonKey, RemoteData.InvalidatedInitial(remoteData)),
                    remainingMs + 1
                );
                return () => clearTimeout(handle);
            }
        }

        return undefined;
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
        };
    };

    return {
        get,
        getMany: (keys: readonly K[]): readonly RemoteDataStore<V>[] => keys.map(get),
    };
};

import { useEffect, useState } from 'react';
import { isDefined } from './internal/isDefined';
import { MaybeCancel } from './internal/MaybeCancel';
import { RemoteData } from './RemoteData';
import { RemoteDataStore } from './RemoteDataStore';
import { RemoteDataStores } from "./RemoteDataStores";
import { Options } from './useRemoteData';

export const useRemoteDatas = <K, V>(run: (key: K) => Promise<V>, options?: Options): RemoteDataStores<K, V> => {
    // current `RemoteData` state
    const [remoteDatas, setRemoteDatas] = useState<ReadonlyMap<K, RemoteData<V>>>(new Map());
    // used for invalidation. only update this when receiving new data
    const [fetchedAts, setFetchedAts] = useState<ReadonlyMap<K, Date>>(new Map());

    const storeName = (key: K | undefined) => {
        if (isDefined(options?.storeName)) {
            if (key !== void 0) {
                return `${options!.storeName}(${key})`;
            }
            return options!.storeName;
        }
        return undefined;
    };

    // don't update state after component unmounted
    let isMounted = true;
    useEffect(
        () => () => {
            if (options?.debug) {
                console.warn(`${storeName(undefined)} unmounting`);
            }
            isMounted = false;
        },
        []
    );

    const set = (key: K, data: RemoteData<V>, fetchedAt?: Date): void => {
        if (isMounted) {
            if (options?.debug) {
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
        } else if (options?.debug) {
            console.warn(`${storeName(key)} dropped update because component has been unmounted`, data, fetchedAt);
        }
    };

    const runAndUpdate = (key: K, pendingState: RemoteData<V>): Promise<void> => {
        set(key, pendingState);
        return run(key).then(
            (value) => set(key, RemoteData.Yes(value), new Date()),
            (error) =>
                set(
                    key,
                    RemoteData.No([error], () => runAndUpdate(key, RemoteData.Pending))
                )
        );
    };

    // only allow first update each pass in case the store is shared
    const isUpdating: Map<K, boolean> = new Map<K, boolean>();

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
    const triggerUpdate = (key: K): MaybeCancel => {
        if (isUpdating.get(key)) {
            return undefined;
        }
        isUpdating.set(key, true);
        const remoteData = remoteDatas.get(key) || RemoteData.Initial;

        if (remoteData.type === 'initial' || remoteData.type === 'invalidated-initial') {
            // note that we let the `Promise` fly here, we don't have a way of cancelling that.
            runAndUpdate(key, RemoteData.pendingStateFor(remoteData));
            return undefined;
        }

        const fetchedAt = fetchedAts.get(key);

        // invalidation logic. only enabled if requested in `options.ttlMillis` and we have data to invalidate
        if (isDefined(options?.ttlMillis) && remoteData.type === 'yes' && isDefined(fetchedAt)) {
            const remainingMs = fetchedAt.getTime() + options!.ttlMillis - new Date().getTime();

            if (remainingMs <= 0) {
                set(key, RemoteData.InvalidatedInitial(remoteData));
            } else {
                if (options?.debug) {
                    console.warn(`${storeName(key)}: will invalidate in ${remainingMs}`);
                }

                const handle = setTimeout(
                    () => set(key, RemoteData.InvalidatedInitial(remoteData)),
                    options?.ttlMillis
                );
                return () => clearTimeout(handle);
            }
        }

        return undefined;
    };

    const get = (key: K): RemoteDataStore<V> => ({
        storeName: storeName(key),
        get current() {
            return remoteDatas.get(key) || RemoteData.Initial;
        },
        triggerUpdate: () => triggerUpdate(key),
    });

    return {
        get,
        getMany: (keys: readonly K[]): readonly RemoteDataStore<V>[] => keys.map(get),
    };
};

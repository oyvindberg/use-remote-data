import { useEffect, useState } from 'react';
import { RemoteData } from './RemoteData';
import { isDefined } from './internal/isDefined';
import { RemoteDataStore } from './RemoteDataStore';

export interface Options {
    debug?: boolean;
    storeName?: string;
    ttlMillis?: number;
}

export const useRemoteData = <T>(run: () => Promise<T>, options?: Options): RemoteDataStore<T> => {
    // current `RemoteData` state
    const [remoteData, setRemoteData] = useState<RemoteData<T>>(RemoteData.Initial);
    // used for invalidation. only update this when receiving new data
    const [fetchedAt, setFetchedAt] = useState<Date | undefined>(undefined);

    const storeName = options?.storeName || 'unnamed store';

    // don't update state after component unmounted
    let isMounted = true;
    useEffect(
        () => () => {
            if (options?.debug) {
                console.warn(`${storeName} unmounting`);
            }
            isMounted = false;
        },
        []
    );

    const set = (data: RemoteData<T>, fetchedAt?: Date): void => {
        if (isMounted) {
            if (options?.debug) {
                console.warn(`${storeName} => `, data, fetchedAt);
            }
            // keep before setRemoteData to not trigger unnecessary invalidations
            if (isDefined(fetchedAt)) {
                setFetchedAt(fetchedAt);
            }

            setRemoteData(data);
        } else if (options?.debug) {
            console.warn(`${storeName} dropped update because component has been unmounted`, data, fetchedAt);
        }
    };

    // invalidation logic. only enabled if requested in `options.ttlMillis` and we have data to invalidate
    useEffect(() => {
        if (isDefined(options?.ttlMillis) && remoteData.type === 'yes' && isDefined(fetchedAt)) {
            const remainingMs = fetchedAt.getTime() + options!.ttlMillis - new Date().getTime();

            if (remainingMs <= 0) {
                set(RemoteData.InvalidatedInitial(remoteData));
            } else {
                if (options?.debug) {
                    console.warn(`${storeName}: will invalidate in ${remainingMs}`);
                }

                const handle = setTimeout(() => set(RemoteData.InvalidatedInitial(remoteData)), options?.ttlMillis);
                return () => clearTimeout(handle);
            }
        }
        return undefined;
    });

    const runAndUpdate = (pendingState: RemoteData<T>): Promise<void> => {
        set(pendingState);
        return run().then(
            (value) => set(RemoteData.Yes(value), new Date()),
            (error) => set(RemoteData.No(error, () => runAndUpdate(RemoteData.Pending)))
        );
    };

    // only allow first update each pass in case the store is shared
    let isUpdating = false;

    // this is what downstream components call within `useEffect`.
    // here we trigger fetching data if we are in an `initial` state
    const triggerUpdate = () => {
        if ((!isUpdating && remoteData.type === 'initial') || remoteData.type === 'invalidated-initial') {
            isUpdating = true;
            return runAndUpdate(RemoteData.pendingStateFor(remoteData));
        }
        return undefined;
    };

    return {
        storeName: options?.storeName,
        get current() {
            return remoteData;
        },
        triggerUpdate,
    };
};

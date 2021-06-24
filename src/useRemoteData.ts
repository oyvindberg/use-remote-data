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
    const [remoteData, rawSetRemoteData] = useState<RemoteData<T>>(RemoteData.Initial);
    const [fetchedAt, setFetchedAt] = useState<Date | null>(null);

    const storeName = options?.storeName || 'unnamed store';

    const setRemoteData = (data: RemoteData<T>) => {
        if (options?.debug) {
            console.warn(`${storeName} => `, data);
        }
        rawSetRemoteData(data);
    };

    // invalidation logic if requested
    useEffect(() => {
        if (isDefined(options?.ttlMillis) && remoteData.type === 'yes' && isDefined(fetchedAt)) {
            const remainingMs = fetchedAt.getTime() + options!.ttlMillis - new Date().getTime();

            if (remainingMs <= 0) {
                setRemoteData(RemoteData.InvalidatedInitial(remoteData));
            } else {
                if (options?.debug) {
                    console.warn(`${storeName}: will invalidate in ${remainingMs}`);
                }

                const handle = setTimeout(
                    () => setRemoteData(RemoteData.InvalidatedInitial(remoteData)),
                    options?.ttlMillis
                );
                return () => clearTimeout(handle);
            }
        }
        return undefined;
    });

    const runAndUpdate = (pendingState: RemoteData<T>): Promise<void> => {
        setRemoteData(pendingState);
        return run().then(
            (value) => {
                setFetchedAt(new Date()); // keep before setData to not trigger unnecessary invalidations
                setRemoteData(RemoteData.Yes(value));
            },
            (error) => setRemoteData(RemoteData.No(error, () => runAndUpdate(RemoteData.Pending)))
        );
    };

    // only allow first update each pass in case the store is shared
    let isUpdating = false;

    // this is what downstream components call within `useEffect`.
    const triggerUpdate = () => {
        if (isUpdating) return undefined;
        isUpdating = true;

        switch (remoteData.type) {
            case 'initial':
                return runAndUpdate(RemoteData.pendingStateFor(remoteData));
            case 'invalidated-initial':
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

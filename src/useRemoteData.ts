import { useEffect, useState } from 'react';
import { isDefined } from './internal/isDefined';
import { MaybeCancel } from './internal/MaybeCancel';
import { RemoteData } from './RemoteData';
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

    const runAndUpdate = (pendingState: RemoteData<T>): Promise<void> => {
        set(pendingState);
        return run().then(
            (value) => set(RemoteData.Yes(value), new Date()),
            (error) => set(RemoteData.No([error], () => runAndUpdate(RemoteData.Pending)))
        );
    };

    // only allow first update each pass in case the store is shared
    let isUpdating = false;

    /**
     * This is where we trigger all progress. It is initiated by client components at render-time within a `setEffect`.
     *
     * The actual data update (ultimately through `set`) is done
     * - inline in this function
     * - performed at the completion of a `Promise`
     * - or after a `setTimeout`
     *
     * A `Triggered` data structure is returned with enough information to cancel timeouts on unmount,
     *  and to wait to completion of `Promise` (for tests, for now at least)
     */
    const triggerUpdate = (): MaybeCancel => {
        if (isUpdating) {
            return undefined;
        }
        isUpdating = true;

        if (remoteData.type === 'initial' || remoteData.type === 'invalidated-initial') {
            // note that we let the `Promise` fly here, we don't have a way of cancelling that.
            runAndUpdate(RemoteData.pendingStateFor(remoteData));
            return undefined;
        }

        // invalidation logic. only enabled if requested in `options.ttlMillis` and we have data to invalidate
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
    };

    return {
        storeName: options?.storeName,
        get current() {
            return remoteData;
        },
        triggerUpdate,
    };
};

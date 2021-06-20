import { useState } from 'react';
import { RemoteData } from './RemoteData';
import { isDefined } from './internal/isDefined';
import { useInterval } from './internal/useInternal';
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

    // only install if we have data and `ttlMillis` is set
    const ttlMillis = enableUseInterval(options, remoteData);

    const maybeOutdatedForMs = (): number | undefined => {
        if (isDefined(fetchedAt) && isDefined(ttlMillis) && remoteData.type === 'yes') {
            const now = new Date();
            const diff = now.getTime() - fetchedAt.getTime();
            if (diff >= ttlMillis) {
                return diff;
            }
        }

        return undefined;
    };

    useInterval(() => {
        const outdatedMs = maybeOutdatedForMs();
        if (isDefined(outdatedMs)) {
            if (options?.debug) {
                console.warn(`${storeName}: invalidated in \`setInterval\` after ${outdatedMs} ms.`);
            }
            setRemoteData(RemoteData.InvalidatedInitial(remoteData));
        }
    }, ttlMillis);

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

    // only commit first update each pass in case the store is shared
    let dirty = false;

    // this is what downstream components call within `useEffect`.
    const triggerUpdate = () => {
        if (dirty) return undefined;
        dirty = true;

        switch (remoteData.type) {
            case 'yes':
                // this branch takes care of invalidating a bit earlier than the `useInterval` above would catch
                // stale data which hasn't been rendered for a while
                const outdatedMs = maybeOutdatedForMs();
                if (isDefined(outdatedMs)) {
                    if (options?.debug) {
                        console.warn(`${storeName}: invalidated at render after ${outdatedMs} ms.`);
                    }
                    return runAndUpdate(RemoteData.pendingStateFor(remoteData));
                }
                return undefined;
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

const enableUseInterval = <T>(options: Options | undefined, data: RemoteData<T>): number | null => {
    const providedTtlMillis = options?.ttlMillis;
    if (isDefined(providedTtlMillis) && data.type === 'yes') {
        return providedTtlMillis;
    }
    return null;
};

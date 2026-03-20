import { CancelTimeout } from './CancelTimeout';
import { Failure } from './Failure';
import { Options } from './Options';
import { RemoteData } from './RemoteData';
import { RemoteDataMap } from './RemoteDataMap';
import { RemoteDataStore } from './RemoteDataStore';
import { Result } from './Result';
import { Staleness } from './Staleness';
import { WeakError } from './WeakError';
import { depsChanged } from './internal/depsChanged';
import { isDefined } from './internal/isDefined';
import { DependencyList, useEffect, useRef, useState, version } from 'react';

const reactMajor = Number(version.split('.')[0]);

export const useRemoteDataMap = <K extends string | number, V>(
    run: (key: K, signal: AbortSignal) => Promise<V>,
    options: Options<V> = {}
): RemoteDataMap<K, V> => useRemoteDataMapCore<K, V, never>((key, signal) => run(key, signal).then(Result.ok), options);

export const useRemoteDataMapResult = <K extends string | number, V, E>(
    run: (key: K, signal: AbortSignal) => Promise<Result<V, E>>,
    options: Options<V> = {}
): RemoteDataMap<K, V, E> => useRemoteDataMapCore(run, options);

/** Internal core — also accepts undefined as K (used by useRemoteData). Not exported from the package. */
export const useRemoteDataMapCore = <K extends string | number | undefined, V, E>(
    run: (key: K, signal: AbortSignal) => Promise<Result<V, E>>,
    options: Options<V> = {}
): RemoteDataMap<K, V, E> => {
    const [remoteDatas, setRemoteDatas] = useState<ReadonlyMap<K, RemoteData<V, E>>>(() => {
        if (options.initial !== undefined) {
            const map = new Map<K, RemoteData<V, E>>();
            map.set(undefined as K, options.initial as RemoteData<V, E>);
            return map;
        }
        return new Map();
    });
    const depsRef = useRef<DependencyList | undefined>(options.dependencies);

    const storeName = (key: K | undefined) => {
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

    // request versioning and abort controllers for cancellation
    const requestVersionsRef = useRef(new Map<K, number>());
    const abortControllersRef = useRef(new Map<K, AbortController>());

    // abort all in-flight requests on unmount
    useEffect(
        () => () => {
            abortControllersRef.current.forEach((c) => c.abort());
        },
        []
    );

    const set = (key: K, data: RemoteData<V, E>): void => {
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

    const runAndUpdate = (key: K, pendingState: RemoteData<V, E>): Promise<void> => {
        // abort previous in-flight request for this key
        abortControllersRef.current.get(key)?.abort();

        // create new controller and increment version
        const controller = new AbortController();
        abortControllersRef.current.set(key, controller);
        const requestVersion = (requestVersionsRef.current.get(key) ?? 0) + 1;
        requestVersionsRef.current.set(key, requestVersion);

        set(key, pendingState);
        try {
            return run(key, controller.signal)
                .then((result) => {
                    if (controller.signal.aborted) return;
                    if (requestVersionsRef.current.get(key) !== requestVersion) return;
                    switch (result.tag) {
                        case 'err': {
                            const no = RemoteData.Failed([Failure.expected(result.value)], () =>
                                runAndUpdate(key, RemoteData.Pending)
                            );
                            set(key, no);
                            break;
                        }
                        case 'ok': {
                            const value: V = result.value;
                            const now = new Date();
                            let res: RemoteData<V, E> = RemoteData.Success(value, now);
                            if (
                                options.refresh &&
                                !Staleness.isFresh(options.refresh.decide(res.value, res.updatedAt, now))
                            ) {
                                res = RemoteData.StaleImmediate(res);
                            }

                            set(key, res);
                        }
                    }
                })
                .catch((error: WeakError) => {
                    if (controller.signal.aborted) return;
                    if (requestVersionsRef.current.get(key) !== requestVersion) return;
                    set(
                        key,
                        RemoteData.Failed<E>([Failure.unexpected(error)], () => runAndUpdate(key, RemoteData.Pending))
                    );
                });
        } catch (error: WeakError) {
            set(
                key,
                RemoteData.Failed<E>([Failure.unexpected(error)], () => runAndUpdate(key, RemoteData.Pending))
            );
            return Promise.resolve();
        }
    };

    // only allow first update each pass in case the store is shared
    const isUpdating: Map<K, boolean> = new Map();

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
    const triggerUpdate = (key: K): CancelTimeout => {
        /** step one: if dependencies have changed, abort in-flight requests and refresh all data */
        if (depsChanged(depsRef.current, options.dependencies)) {
            if (options.debug) {
                options.debug(
                    `${storeName(key)} refreshing due to deps, from/to:`,
                    depsRef.current,
                    options.dependencies
                );
            }

            // abort all in-flight requests and bump their versions so stale responses are discarded
            abortControllersRef.current.forEach((c) => c.abort());
            abortControllersRef.current.clear();
            requestVersionsRef.current.forEach((v, k) => {
                requestVersionsRef.current.set(k, v + 1);
            });

            depsRef.current = options.dependencies;

            const refreshedRemoteDatas = new Map<K, RemoteData<V, E>>();
            remoteDatas.forEach((remoteData, key) =>
                refreshedRemoteDatas.set(key, RemoteData.initialStateFor(remoteData))
            );
            setRemoteDatas(refreshedRemoteDatas);

            return;
        }

        /** step two: if we're already updating, do nothing */
        if (isUpdating.get(key)) {
            return;
        }
        isUpdating.set(key, true);

        /** step three: if we're in an initial state, start data fetching in the background */
        const remoteData = remoteDatas.get(key) || RemoteData.Initial;

        if (remoteData.type === 'initial' || remoteData.type === 'stale-initial') {
            runAndUpdate(key, RemoteData.pendingStateFor(remoteData));
            return;
        }

        /** step four: refresh logic (if enabled in `options.refresh`) */
        if (isDefined(options.refresh) && (remoteData.type === 'success' || remoteData.type === 'stale-immediate')) {
            const success = remoteData.type === 'success' ? remoteData : remoteData.stale;
            const staleness = options.refresh.decide(success.value, success.updatedAt, new Date());

            switch (staleness.type) {
                case 'stale':
                    set(key, RemoteData.StaleInitial(success));
                    return;
                case 'fresh':
                    return;
                case 'check-after':
                    if (options.debug) {
                        options.debug(`${storeName(key)}: will refresh in ${staleness.millis}`);
                    }

                    const handle = setTimeout(() => set(key, RemoteData.StaleInitial(success)), staleness.millis);
                    return () => {
                        if (options.debug) {
                            options.debug(`${storeName(key)}: cancelled refresh on unmount`);
                        }
                        clearTimeout(handle);
                    };
            }
        }
    };

    const get = (key: K): RemoteDataStore<V, E> => {
        return {
            storeName: storeName(key),
            get current() {
                return remoteDatas.get(key) || RemoteData.Initial;
            },
            refresh: () => {
                abortControllersRef.current.get(key)?.abort();
                const currentVersion = requestVersionsRef.current.get(key) ?? 0;
                requestVersionsRef.current.set(key, currentVersion + 1);
                set(key, RemoteData.initialStateFor(remoteDatas.get(key) || RemoteData.Initial));
            },
            triggerUpdate: () => triggerUpdate(key),
            get orNull(): RemoteDataStore<V | null, E> {
                return RemoteDataStore.orNull(this);
            },
            map<U>(fn: (value: V) => U): RemoteDataStore<U, E> {
                return RemoteDataStore.map(this, fn);
            },
        };
    };

    return {
        get,
        getMany: (keys: readonly K[]): readonly RemoteDataStore<V, E>[] => keys.map(get),
    };
};

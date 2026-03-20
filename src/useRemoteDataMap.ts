import { CancelTimeout } from './CancelTimeout';
import { Either } from './Either';
import { IsInvalidated } from './IsInvalidated';
import { Options } from './Options';
import { RemoteData } from './RemoteData';
import { RemoteDataStore } from './RemoteDataStore';
import { RemoteDataMap } from './RemoteDataMap';
import { WeakError } from './WeakError';
import { JsonKey } from './internal/JsonKey';
import { isDefined } from './internal/isDefined';
import { useEffect, useRef, useState, version } from 'react';

const reactMajor = Number(version.split('.')[0]);

export const useRemoteDataMap = <K, V>(run: (key: K, signal: AbortSignal) => Promise<V>, options: Options<V> = {}): RemoteDataMap<K, V> =>
    useRemoteDataMapEither<K, V, never>((key, signal) => run(key, signal).then(Either.right), options);

export const useRemoteDataMapEither = <K, V, E>(
    run: (key: K, signal: AbortSignal) => Promise<Either<E, V>>,
    options: Options<V> = {}
): RemoteDataMap<K, V, E> => {
    const [remoteDatas, setRemoteDatas] = useState<ReadonlyMap<JsonKey<K>, RemoteData<V, E>>>(() => {
        if (options.initial !== undefined) {
            const map = new Map<JsonKey<K>, RemoteData<V, E>>();
            map.set(JsonKey.of(undefined as K), options.initial as RemoteData<V, E>);
            return map;
        }
        return new Map();
    });
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

    // request versioning and abort controllers for cancellation
    const requestVersionsRef = useRef(new Map<JsonKey<K>, number>());
    const abortControllersRef = useRef(new Map<JsonKey<K>, AbortController>());

    // abort all in-flight requests on unmount
    useEffect(
        () => () => {
            abortControllersRef.current.forEach((c) => c.abort());
        },
        []
    );

    const set = (key: JsonKey<K>, data: RemoteData<V, E>): void => {
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

    const runAndUpdate = (key: K, jsonKey: JsonKey<K>, pendingState: RemoteData<V, E>): Promise<void> => {
        // abort previous in-flight request for this key
        abortControllersRef.current.get(jsonKey)?.abort();

        // create new controller and increment version
        const controller = new AbortController();
        abortControllersRef.current.set(jsonKey, controller);
        const requestVersion = (requestVersionsRef.current.get(jsonKey) ?? 0) + 1;
        requestVersionsRef.current.set(jsonKey, requestVersion);

        set(jsonKey, pendingState);
        try {
            return run(key, controller.signal)
                .then((either) => {
                    if (controller.signal.aborted) return;
                    if (requestVersionsRef.current.get(jsonKey) !== requestVersion) return;
                    switch (either.tag) {
                        case 'left': {
                            const no = RemoteData.Failed([Either.right(either.value)], () =>
                                runAndUpdate(key, jsonKey, RemoteData.Pending)
                            );
                            set(jsonKey, no);
                            break;
                        }
                        case 'right': {
                            const value: V = either.value;
                            const now = new Date();
                            let res: RemoteData<V, E> = RemoteData.Success(value, now);
                            if (
                                options.invalidation &&
                                !IsInvalidated.isValid(options.invalidation.decide(res.value, res.updatedAt, now))
                            ) {
                                res = RemoteData.InvalidatedImmediate(res);
                            }

                            set(jsonKey, res);
                        }
                    }
                })
                .catch((error: WeakError) => {
                    if (controller.signal.aborted) return;
                    if (requestVersionsRef.current.get(jsonKey) !== requestVersion) return;
                    set(
                        jsonKey,
                        RemoteData.Failed<E>([Either.left(error)], () => runAndUpdate(key, jsonKey, RemoteData.Pending))
                    );
                });
        } catch (error: WeakError) {
            set(
                jsonKey,
                RemoteData.Failed<E>([Either.left(error)], () => runAndUpdate(key, jsonKey, RemoteData.Pending))
            );
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
    const triggerUpdate = (key: K, jsonKey: JsonKey<K>): CancelTimeout => {
        /** step one: if dependencies have changed, abort in-flight requests and invalidate all data */
        const currentDeps = JsonKey.of(options.dependencies);
        if (deps !== currentDeps) {
            if (options.debug) {
                options.debug(`${storeName(jsonKey)} invalidating due to deps, from/to:`, deps, currentDeps);
            }

            // abort all in-flight requests and bump their versions so stale responses are discarded
            abortControllersRef.current.forEach((c) => c.abort());
            abortControllersRef.current.clear();
            requestVersionsRef.current.forEach((v, k) => {
                requestVersionsRef.current.set(k, v + 1);
            });

            setDeps(currentDeps);

            const invalidatedRemoteDatas = new Map<JsonKey<K>, RemoteData<V, E>>();
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
            runAndUpdate(key, jsonKey, RemoteData.pendingStateFor(remoteData));
            return;
        }

        /** step four: invalidation logic (if enabled in `options.invalidation`) */
        if (
            isDefined(options.invalidation) &&
            (remoteData.type === 'success' || remoteData.type === 'invalidated-immediate')
        ) {
            const success = remoteData.type === 'success' ? remoteData : remoteData.invalidated;
            const isInvalidated = options.invalidation.decide(success.value, success.updatedAt, new Date());

            switch (isInvalidated.type) {
                case 'invalid':
                    set(jsonKey, RemoteData.InvalidatedInitial(success));
                    return;
                case 'valid':
                    return;
                case 'retry-in':
                    if (options.debug) {
                        options.debug(`${storeName(jsonKey)}: will invalidate in ${isInvalidated.millis}`);
                    }

                    const handle = setTimeout(
                        () => set(jsonKey, RemoteData.InvalidatedInitial(success)),
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

    const get = (key: K): RemoteDataStore<V, E> => {
        const jsonKey = JsonKey.of(key);

        return {
            storeName: storeName(jsonKey),
            get current() {
                return remoteDatas.get(jsonKey) || RemoteData.Initial;
            },
            invalidate: () => {
                abortControllersRef.current.get(jsonKey)?.abort();
                const currentVersion = requestVersionsRef.current.get(jsonKey) ?? 0;
                requestVersionsRef.current.set(jsonKey, currentVersion + 1);
                set(jsonKey, RemoteData.initialStateFor(remoteDatas.get(jsonKey) || RemoteData.Initial));
            },
            triggerUpdate: () => triggerUpdate(key, jsonKey),
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

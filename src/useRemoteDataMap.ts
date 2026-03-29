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
import { DependencyList, useEffect, useRef, useState } from 'react';

export const useRemoteDataMap = <K extends string | number, V>(
    run: (key: K, signal: AbortSignal) => Promise<V>,
    options: Options<V> = {}
): RemoteDataMap<K, V> => useRemoteDataMapCore<K, V, never>((key, signal) => run(key, signal).then(Result.ok), options);

export const useRemoteDataMapResult = <K extends string | number, V, E>(
    run: (key: K, signal: AbortSignal) => Promise<Result<V, E>>,
    options: Options<V> = {}
): RemoteDataMap<K, V, E> => useRemoteDataMapCore(run, options);

// ---------------------------------------------------------------------------
// Class instances — allocated once per hook, not per render
// ---------------------------------------------------------------------------

class KeyStore<K extends string | number | undefined, V, E> implements RemoteDataStore<V, E> {
    readonly #parent: MapStore<K, V, E>;
    readonly #key: K;

    constructor(parent: MapStore<K, V, E>, key: K) {
        this.#parent = parent;
        this.#key = key;
    }

    get storeName(): string | undefined {
        return this.#parent.keyStoreName(this.#key);
    }

    get current(): RemoteData<V, E> {
        return this.#parent.remoteDatas.get(this.#key) || RemoteData.Initial;
    }

    triggerUpdate = (): CancelTimeout => {
        return this.#parent.triggerUpdate(this.#key);
    };

    refresh = (): void => {
        this.#parent.refreshKey(this.#key);
    };

    get orNull(): RemoteDataStore<V | null, E> {
        return RemoteDataStore.orNull(this);
    }

    map<U>(fn: (value: V) => U): RemoteDataStore<U, E> {
        return RemoteDataStore.map(this, fn);
    }
}

class MapStore<K extends string | number | undefined, V, E> implements RemoteDataMap<K, V, E> {
    readonly #setRemoteDatas: React.Dispatch<React.SetStateAction<ReadonlyMap<K, RemoteData<V, E>>>>;
    readonly #requestVersions = new Map<K, number>();
    readonly #abortControllers = new Map<K, AbortController>();
    readonly #refreshHandles = new Map<K, { handle: ReturnType<typeof setTimeout>; updatedAt: Date }>();
    readonly #storeViews = new Map<K, KeyStore<K, V, E>>();
    #deps: DependencyList | undefined;

    // synced each render
    run!: (key: K, signal: AbortSignal) => Promise<Result<V, E>>;
    options!: Options<V>;
    remoteDatas!: ReadonlyMap<K, RemoteData<V, E>>;

    // per-render dedup guard — cleared in sync()
    #isUpdating = new Map<K, boolean>();

    constructor(
        setRemoteDatas: React.Dispatch<React.SetStateAction<ReadonlyMap<K, RemoteData<V, E>>>>,
        run: (key: K, signal: AbortSignal) => Promise<Result<V, E>>,
        options: Options<V>,
        remoteDatas: ReadonlyMap<K, RemoteData<V, E>>
    ) {
        this.#setRemoteDatas = setRemoteDatas;
        this.run = run;
        this.options = options;
        this.remoteDatas = remoteDatas;
        this.#deps = options.dependencies;
    }

    sync(
        run: (key: K, signal: AbortSignal) => Promise<Result<V, E>>,
        options: Options<V>,
        remoteDatas: ReadonlyMap<K, RemoteData<V, E>>
    ): void {
        this.run = run;
        this.options = options;
        this.remoteDatas = remoteDatas;
        this.#isUpdating.clear();
    }

    keyStoreName(key: K | undefined): string | undefined {
        if (isDefined(this.options.storeName)) {
            if (isDefined(key)) {
                return `${this.options.storeName}(${key})`;
            }
            return this.options.storeName;
        }
        return;
    }

    #set(key: K, data: RemoteData<V, E>): void {
        if (this.options.debug) {
            this.options.debug(`${this.keyStoreName(key)} => `, data);
        }

        this.#setRemoteDatas((oldRemoteDatas) => {
            const newRemoteDatas = new Map(oldRemoteDatas);
            newRemoteDatas.set(key, data);
            return newRemoteDatas;
        });
    }

    #runAndUpdate(key: K, pendingState: RemoteData<V, E>): Promise<void> {
        // abort previous in-flight request for this key
        this.#abortControllers.get(key)?.abort();

        // create new controller and increment version
        const controller = new AbortController();
        this.#abortControllers.set(key, controller);
        const requestVersion = (this.#requestVersions.get(key) ?? 0) + 1;
        this.#requestVersions.set(key, requestVersion);

        this.#set(key, pendingState);
        try {
            return this.run(key, controller.signal)
                .then((result) => {
                    if (controller.signal.aborted) return;
                    if (this.#requestVersions.get(key) !== requestVersion) return;
                    switch (result.tag) {
                        case 'err': {
                            const no = RemoteData.Failed([Failure.expected(result.value)], () =>
                                this.#runAndUpdate(key, RemoteData.Pending)
                            );
                            this.#set(key, no);
                            break;
                        }
                        case 'ok': {
                            const value: V = result.value;
                            const now = new Date();
                            let res: RemoteData<V, E> = RemoteData.Success(value, now);
                            if (
                                this.options.refresh &&
                                !Staleness.isFresh(this.options.refresh.decide(res.value, res.updatedAt, now))
                            ) {
                                res = RemoteData.StaleImmediate(res);
                            }

                            this.#set(key, res);
                        }
                    }
                })
                .catch((error: WeakError) => {
                    if (controller.signal.aborted) return;
                    if (this.#requestVersions.get(key) !== requestVersion) return;
                    this.#set(
                        key,
                        RemoteData.Failed<E>([Failure.unexpected(error)], () =>
                            this.#runAndUpdate(key, RemoteData.Pending)
                        )
                    );
                });
        } catch (error: WeakError) {
            this.#set(
                key,
                RemoteData.Failed<E>([Failure.unexpected(error)], () =>
                    this.#runAndUpdate(key, RemoteData.Pending)
                )
            );
            return Promise.resolve();
        }
    }

    triggerUpdate(key: K): CancelTimeout {
        /** step one: if dependencies have changed, abort in-flight requests and refresh all data */
        if (depsChanged(this.#deps, this.options.dependencies)) {
            if (this.options.debug) {
                this.options.debug(
                    `${this.keyStoreName(key)} refreshing due to deps, from/to:`,
                    this.#deps,
                    this.options.dependencies
                );
            }

            // abort all in-flight requests and bump their versions so stale responses are discarded
            this.#abortControllers.forEach((c) => c.abort());
            this.#abortControllers.clear();
            this.#refreshHandles.forEach(({ handle }) => clearTimeout(handle));
            this.#refreshHandles.clear();
            this.#requestVersions.forEach((v, k) => {
                this.#requestVersions.set(k, v + 1);
            });

            this.#deps = this.options.dependencies;

            const refreshedRemoteDatas = new Map<K, RemoteData<V, E>>();
            this.remoteDatas.forEach((remoteData, key) =>
                refreshedRemoteDatas.set(key, RemoteData.initialStateFor(remoteData))
            );
            this.#setRemoteDatas(refreshedRemoteDatas);

            return;
        }

        /** step two: if we're already updating, do nothing */
        if (this.#isUpdating.get(key)) {
            return;
        }
        this.#isUpdating.set(key, true);

        /** step three: if we're in an initial state, start data fetching in the background */
        const remoteData = this.remoteDatas.get(key) || RemoteData.Initial;

        if (remoteData.type === 'initial' || remoteData.type === 'stale-initial') {
            this.#runAndUpdate(key, RemoteData.pendingStateFor(remoteData));
            return;
        }

        /** step four: refresh logic (if enabled in `options.refresh`) */
        if (isDefined(this.options.refresh) && (remoteData.type === 'success' || remoteData.type === 'stale-immediate')) {
            const success = remoteData.type === 'success' ? remoteData : remoteData.stale;
            const staleness = this.options.refresh.decide(success.value, success.updatedAt, new Date());

            switch (staleness.type) {
                case 'stale':
                    this.#set(key, RemoteData.StaleInitial(success));
                    return;
                case 'fresh':
                    return;
                case 'check-after': {
                    // skip if a timer is already running for this exact data version
                    const existing = this.#refreshHandles.get(key);
                    if (existing && existing.updatedAt.getTime() === success.updatedAt.getTime()) {
                        return;
                    }
                    if (existing) {
                        clearTimeout(existing.handle);
                    }

                    if (this.options.debug) {
                        this.options.debug(`${this.keyStoreName(key)}: will refresh in ${staleness.millis}`);
                    }

                    const handle = setTimeout(() => {
                        this.#refreshHandles.delete(key);
                        this.#set(key, RemoteData.StaleInitial(success));
                    }, staleness.millis);
                    this.#refreshHandles.set(key, { handle, updatedAt: success.updatedAt });
                    return;
                }
            }
        }
    }

    refreshKey(key: K): void {
        const timer = this.#refreshHandles.get(key);
        if (timer) {
            clearTimeout(timer.handle);
            this.#refreshHandles.delete(key);
        }
        this.#abortControllers.get(key)?.abort();
        const currentVersion = this.#requestVersions.get(key) ?? 0;
        this.#requestVersions.set(key, currentVersion + 1);
        this.#setRemoteDatas((old) => {
            const current = old.get(key) || RemoteData.Initial;
            const next = RemoteData.initialStateFor(current);
            if (this.options.debug) {
                this.options.debug(`${this.keyStoreName(key)} => `, next);
            }
            const updated = new Map(old);
            updated.set(key, next);
            return updated;
        });
    }

    cleanup(): void {
        this.#abortControllers.forEach((c) => c.abort());
        if (this.#refreshHandles.size > 0) {
            this.#refreshHandles.forEach(({ handle }, key) => {
                if (this.options.debug) {
                    this.options.debug(`${this.keyStoreName(key)}: cancelled refresh on unmount`);
                }
                clearTimeout(handle);
            });
        }
    }

    get(key: K): RemoteDataStore<V, E> {
        let view = this.#storeViews.get(key);
        if (!view) {
            view = new KeyStore(this, key);
            this.#storeViews.set(key, view);
        }
        return view;
    }

    getMany(keys: readonly K[]): readonly RemoteDataStore<V, E>[] {
        return keys.map((k) => this.get(k));
    }
}

// ---------------------------------------------------------------------------
// Hooks — thin wrappers that connect the class instances to React state
// ---------------------------------------------------------------------------

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

    const storeRef = useRef<MapStore<K, V, E> | null>(null);
    if (storeRef.current === null) {
        storeRef.current = new MapStore(setRemoteDatas, run, options, remoteDatas);
    }
    storeRef.current.sync(run, options, remoteDatas);

    useEffect(() => () => storeRef.current!.cleanup(), []);

    return storeRef.current;
};

import { CancelTimeout } from './CancelTimeout';
import { Failure } from './Failure';
import { RemoteData } from './RemoteData';
import { RemoteDataStore } from './RemoteDataStore';
import { type SharedStoreOptions } from './SharedStoreOptions';
import { Staleness } from './Staleness';
import { type WeakError } from './WeakError';
import { type ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Registry — the mutable bag of shared state, held in a ref
// ---------------------------------------------------------------------------

interface Entry<T> {
    /** How many mounted hooks are using this entry */
    refCount: number;
    /** The current RemoteData state */
    state: RemoteData<T, never>;
    /** Subscribers — each mounted hook registers a setState here */
    listeners: Set<(rd: RemoteData<T, never>) => void>;
    /** Abort controller for the current in-flight request */
    abortController: AbortController | null;
    /** Monotonic request version (stale-response guard) */
    requestVersion: number;
    /** The fetcher — from the first hook that registered this name */
    run: (signal: AbortSignal) => Promise<T>;
    /** Options snapshot from the first registrant */
    options: SharedStoreOptions<T>;
    /** Active refresh timeout handle */
    refreshHandle: ReturnType<typeof setTimeout> | null;
    /** Pending GC timeout handle */
    gcHandle: ReturnType<typeof setTimeout> | null;
}

class StoreRegistry {
    readonly #entries = new Map<string, Entry<unknown>>();
    readonly #initialData: Record<string, unknown>;

    constructor(initialData: Record<string, unknown>) {
        this.#initialData = initialData;
    }

    get<T>(name: string): Entry<T> | undefined {
        return this.#entries.get(name) as Entry<T> | undefined;
    }

    getOrCreate<T>(name: string, run: (signal: AbortSignal) => Promise<T>, options: SharedStoreOptions<T>): Entry<T> {
        let entry = this.#entries.get(name) as Entry<T> | undefined;
        if (entry) {
            // Dev-mode warning for mismatched fetcher references
            if (process.env.NODE_ENV !== 'production') {
                if (entry.run !== run) {
                    const warn = options.debug ?? entry.options.debug;
                    if (warn) {
                        warn(
                            `[SharedStoreProvider] Warning: "${name}" was registered with a different fetcher reference. ` +
                                `The original fetcher will be used. Wrap your fetcher in useCallback or define it outside the component.`
                        );
                    }
                }
            }
            return entry;
        }

        // Check if we have SSR initial data for this name
        const initialValue = this.#initialData[name];
        const initialState: RemoteData<T, never> =
            initialValue !== undefined
                ? RemoteData.Success(initialValue as T, new Date())
                : (RemoteData.Initial as RemoteData<T, never>);

        entry = {
            refCount: 0,
            state: initialState,
            listeners: new Set(),
            abortController: null,
            requestVersion: 0,
            run,
            options,
            refreshHandle: null,
            gcHandle: null,
        };
        this.#entries.set(name, entry as Entry<unknown>);
        return entry;
    }

    delete(name: string): void {
        const entry = this.#entries.get(name);
        if (entry) {
            entry.abortController?.abort();
            if (entry.refreshHandle !== null) clearTimeout(entry.refreshHandle);
            if (entry.gcHandle !== null) clearTimeout(entry.gcHandle);
            this.#entries.delete(name);
        }
    }

    cancelGc<T>(entry: Entry<T>): void {
        if (entry.gcHandle !== null) {
            clearTimeout(entry.gcHandle);
            entry.gcHandle = null;
        }
    }

    scheduleGc(name: string, gcTime: number): void {
        const entry = this.#entries.get(name);
        if (!entry) return;
        if (entry.gcHandle !== null) clearTimeout(entry.gcHandle);
        entry.gcHandle = setTimeout(() => {
            entry.gcHandle = null;
            // Only delete if still zero subscribers
            if (entry.refCount <= 0) {
                this.delete(name);
            }
        }, gcTime);
    }

    /** Broadcast new state to all listening hooks for this entry */
    broadcast<T>(name: string, entry: Entry<T>, next: RemoteData<T, never>): void {
        entry.state = next;
        if (entry.options.debug) {
            entry.options.debug(`[shared] ${name} =>`, next);
        }
        entry.listeners.forEach((fn) => fn(next));
    }

    /** Run the fetcher, update state, handle refresh scheduling */
    fetch<T>(name: string, entry: Entry<T>): void {
        // abort previous
        entry.abortController?.abort();

        const controller = new AbortController();
        entry.abortController = controller;
        const version = ++entry.requestVersion;

        this.broadcast(name, entry, RemoteData.pendingStateFor(entry.state));

        entry
            .run(controller.signal)
            .then((value) => {
                if (controller.signal.aborted) return;
                if (entry.requestVersion !== version) return;

                const now = new Date();
                let next: RemoteData<T, never> = RemoteData.Success(value, now);

                // check immediate staleness
                if (entry.options.refresh && !Staleness.isFresh(entry.options.refresh.decide(value, now, now))) {
                    next = RemoteData.StaleImmediate(next as RemoteData.Success<T>);
                }

                this.broadcast(name, entry, next);
                this.scheduleRefresh(name, entry);
            })
            .catch((error: WeakError) => {
                if (controller.signal.aborted) return;
                if (entry.requestVersion !== version) return;

                this.broadcast(
                    name,
                    entry,
                    RemoteData.Failed<never>([Failure.unexpected(error)], async () => {
                        this.fetch(name, entry);
                    })
                );
            });
    }

    scheduleRefresh<T>(name: string, entry: Entry<T>): void {
        if (entry.refreshHandle !== null) {
            clearTimeout(entry.refreshHandle);
            entry.refreshHandle = null;
        }

        if (!entry.options.refresh) return;

        const state = entry.state;
        if (state.type !== 'success' && state.type !== 'stale-immediate') return;

        const success = state.type === 'success' ? state : state.stale;
        const staleness = entry.options.refresh.decide(success.value, success.updatedAt, new Date());

        switch (staleness.type) {
            case 'stale':
                this.fetch(name, entry);
                break;
            case 'check-after':
                if (entry.options.debug) {
                    entry.options.debug(`[shared] ${name}: will refresh in ${staleness.millis}`);
                }
                entry.refreshHandle = setTimeout(() => {
                    entry.refreshHandle = null;
                    this.fetch(name, entry);
                }, staleness.millis);
                break;
            case 'fresh':
                break;
        }
    }
}

// ---------------------------------------------------------------------------
// React context
// ---------------------------------------------------------------------------

const SharedStoreContext = createContext<StoreRegistry | null>(null);

interface SharedStoreProviderProps {
    children: ReactNode;
    /**
     * Pre-seed stores with server-rendered data.
     * Keys are store names, values are the success data.
     *
     * ```tsx
     * <SharedStoreProvider initialData={{ currentUser: serverUser, posts: serverPosts }}>
     *   <App />
     * </SharedStoreProvider>
     * ```
     */
    initialData?: Record<string, unknown>;
}

export function SharedStoreProvider({ children, initialData }: SharedStoreProviderProps) {
    // single registry per provider, stable across renders
    const registryRef = useRef<StoreRegistry | null>(null);
    if (registryRef.current === null) {
        registryRef.current = new StoreRegistry(initialData ?? {});
    }

    return <SharedStoreContext.Provider value={registryRef.current}>{children}</SharedStoreContext.Provider>;
}

// ---------------------------------------------------------------------------
// The hook
// ---------------------------------------------------------------------------

/**
 * Like `useRemoteData`, but deduplicates by `name` across the component tree.
 *
 * The first component to mount with a given name creates the entry and its
 * fetcher. Subsequent components with the same name share the same state
 * and never trigger a duplicate fetch.
 *
 * When the last component using a name unmounts, the entry is cleaned up
 * (in-flight requests aborted, refresh timers cancelled, state dropped).
 * Use the `gcTime` option to add a grace period before cleanup.
 */
export function useSharedRemoteData<T>(
    name: string,
    run: (signal: AbortSignal) => Promise<T>,
    options?: SharedStoreOptions<T>
): RemoteDataStore<T> {
    const registry = useContext(SharedStoreContext);
    if (!registry) {
        throw new Error('useSharedRemoteData must be used inside <SharedStoreProvider>');
    }

    const resolvedOptions: SharedStoreOptions<T> = options ?? {};
    const entry = registry.getOrCreate<T>(name, run, resolvedOptions);

    // local state — synced from the shared entry via listener
    const [state, setState] = useState<RemoteData<T, never>>(() => entry.state);

    useEffect(() => {
        entry.refCount++;
        entry.listeners.add(setState);
        registry.cancelGc(entry);

        if (entry.refCount === 1 && entry.state.type === 'initial') {
            // First subscriber, entry is fresh — kick off the fetch
            registry.fetch(name, entry);
        } else if (entry.refCount === 1) {
            // First subscriber, but state is already populated (e.g., from initialData)
            // Sync local state and schedule refresh if configured
            setState(entry.state);
            registry.scheduleRefresh(name, entry);
        } else {
            // Late joiner — sync to current state
            setState(entry.state);
        }

        return () => {
            entry.refCount--;
            entry.listeners.delete(setState);

            if (entry.refCount <= 0) {
                const gcTime = resolvedOptions.gcTime;
                if (gcTime !== undefined && gcTime > 0) {
                    registry.scheduleGc(name, gcTime);
                } else {
                    registry.delete(name);
                }
            }
        };
    }, [name]);

    // build a RemoteDataStore facade — created fresh each render to avoid stale closures
    const store: RemoteDataStore<T> = {
        storeName: name,
        get current() {
            return state;
        },
        triggerUpdate: (): CancelTimeout => {
            // refresh scheduling is handled by the registry,
            // but we still need this to be callable from <Await>
            registry.scheduleRefresh(name, entry);
            return undefined;
        },
        refresh: () => {
            registry.fetch(name, entry);
        },
        get orNull(): RemoteDataStore<T | null> {
            return RemoteDataStore.orNull(store);
        },
        map<U>(fn: (value: T) => U): RemoteDataStore<U> {
            return RemoteDataStore.map(store, fn);
        },
    };

    return store;
}

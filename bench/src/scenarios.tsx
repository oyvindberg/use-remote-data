/**
 * Four scenario implementations, each doing the same work:
 *   1. Fetch a number (5ms simulated latency)
 *   2. Render it once resolved
 *   3. Show "..." while loading
 *
 * Variants:
 *   - raw React (useState + useEffect, no library)
 *   - use-remote-data (current, class-based)
 *   - use-remote-data "old style" (closures per render, inlined)
 *   - @tanstack/react-query
 */
import React, { DependencyList, useEffect, useRef, useState } from 'react';
import {
    Await,
    useRemoteData,
} from 'use-remote-data';
import { RemoteData } from 'use-remote-data/RemoteData';
import { RemoteDataStore } from 'use-remote-data/RemoteDataStore';
import { Result } from 'use-remote-data/Result';
import { Failure } from 'use-remote-data/Failure';
import { CancelTimeout } from 'use-remote-data/CancelTimeout';
import { Options } from 'use-remote-data/Options';
import { WeakError } from 'use-remote-data/WeakError';
import { isDefined } from 'use-remote-data/internal/isDefined';

import {
    QueryClient,
    QueryClientProvider,
    useQuery,
} from '@tanstack/react-query';

import type { Scenario } from './harness';

// ---------------------------------------------------------------------------
// Shared fetcher — 5ms simulated latency
// ---------------------------------------------------------------------------

const fakeFetch = (id: number): Promise<number> =>
    new Promise((r) => setTimeout(() => r(id * 10), 5));

// ---------------------------------------------------------------------------
// 0. Raw React baseline — useState + useEffect, no library
// ---------------------------------------------------------------------------

function RawItem({ id }: { id: number }) {
    const [data, setData] = useState<number | null>(null);

    useEffect(() => {
        let cancelled = false;
        fakeFetch(id).then((v) => {
            if (!cancelled) setData(v);
        });
        return () => { cancelled = true; };
    }, [id]);

    if (data === null) return <span>...</span>;
    return <span data-resolved>{data}</span>;
}

export const rawScenario: Scenario = {
    name: 'raw React (no library)',
    Item: RawItem,
};

// ---------------------------------------------------------------------------
// 1. use-remote-data (current, class-based)
// ---------------------------------------------------------------------------

const loading = () => <span>...</span>;

function URDItem({ id }: { id: number }) {
    const store = useRemoteData(() => fakeFetch(id));
    return (
        <Await store={store} loading={loading}>
            {(v) => <span data-resolved>{v}</span>}
        </Await>
    );
}

export const urdScenario: Scenario = {
    name: 'use-remote-data (classes)',
    Item: URDItem,
};

// ---------------------------------------------------------------------------
// 2. use-remote-data OLD STYLE — closures per render
//    Faithful reproduction of the pre-optimisation hook shape.
// ---------------------------------------------------------------------------

function OldAwait<T>({ store, children }: {
    store: RemoteDataStore<T>;
    children: (value: T, isStale: boolean) => React.ReactNode;
}) {
    useEffect(store.triggerUpdate, [store]);
    return RemoteData.fold(store.current)<React.ReactElement>(
        (value, isStale) => <div>{children(value, isStale)}</div>,
        () => <span>...</span>,
        () => <span>err</span>
    );
}

const useRemoteDataOld = <T,>(
    rawRun: (signal: AbortSignal) => Promise<T>,
    options: Options<T> = {}
): RemoteDataStore<T> => {
    type K = undefined;
    const run = (_key: K, signal: AbortSignal): Promise<Result<T, never>> =>
        rawRun(signal).then(Result.ok);

    const [remoteDatas, setRemoteDatas] = useState<ReadonlyMap<K, RemoteData<T, never>>>(() => new Map());
    const depsRef = useRef<DependencyList | undefined>(options.dependencies);
    const requestVersionsRef = useRef(new Map<K, number>());
    const abortControllersRef = useRef(new Map<K, AbortController>());
    const refreshHandlesRef = useRef(
        new Map<K, { handle: ReturnType<typeof setTimeout>; updatedAt: Date }>()
    );

    useEffect(
        () => () => {
            abortControllersRef.current.forEach((c) => c.abort());
            refreshHandlesRef.current.forEach(({ handle }) => clearTimeout(handle));
        },
        []
    );

    const storeName = (key: K | undefined): string | undefined => {
        if (isDefined(options.storeName)) {
            if (isDefined(key)) return `${options.storeName}(${key})`;
            return options.storeName;
        }
        return;
    };

    const set = (key: K, data: RemoteData<T, never>): void => {
        setRemoteDatas((old) => {
            const next = new Map(old);
            next.set(key, data);
            return next;
        });
    };

    const runAndUpdate = (key: K, pendingState: RemoteData<T, never>): Promise<void> => {
        abortControllersRef.current.get(key)?.abort();
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
                        case 'ok': {
                            const value = result.value;
                            const now = new Date();
                            set(key, RemoteData.Success(value, now));
                        }
                    }
                })
                .catch((error: WeakError) => {
                    if (controller.signal.aborted) return;
                    if (requestVersionsRef.current.get(key) !== requestVersion) return;
                    set(key, RemoteData.Failed<never>(
                        [Failure.unexpected(error)],
                        () => runAndUpdate(key, RemoteData.Pending)
                    ));
                });
        } catch (error: WeakError) {
            set(key, RemoteData.Failed<never>(
                [Failure.unexpected(error)],
                () => runAndUpdate(key, RemoteData.Pending)
            ));
            return Promise.resolve();
        }
    };

    const isUpdating: Map<K, boolean> = new Map();
    const key = undefined;

    const triggerUpdate = (): CancelTimeout => {
        if (isUpdating.get(key)) return;
        isUpdating.set(key, true);
        const remoteData = remoteDatas.get(key) || RemoteData.Initial;
        if (remoteData.type === 'initial' || remoteData.type === 'stale-initial') {
            runAndUpdate(key, RemoteData.pendingStateFor(remoteData));
        }
        return;
    };

    return {
        storeName: storeName(key),
        get current() { return remoteDatas.get(key) || RemoteData.Initial; },
        refresh: () => {
            abortControllersRef.current.get(key)?.abort();
            const cv = requestVersionsRef.current.get(key) ?? 0;
            requestVersionsRef.current.set(key, cv + 1);
            setRemoteDatas((old) => {
                const c = old.get(key) || RemoteData.Initial;
                const u = new Map(old);
                u.set(key, RemoteData.initialStateFor(c));
                return u;
            });
        },
        triggerUpdate: () => triggerUpdate(),
        get orNull(): RemoteDataStore<T | null> { return RemoteDataStore.orNull(this); },
        map<U>(fn: (value: T) => U): RemoteDataStore<U> { return RemoteDataStore.map(this, fn); },
    };
};

function OldURDItem({ id }: { id: number }) {
    const store = useRemoteDataOld(() => fakeFetch(id));
    return (
        <OldAwait store={store}>
            {(v) => <span data-resolved>{v}</span>}
        </OldAwait>
    );
}

export const urdOldScenario: Scenario = {
    name: 'use-remote-data (closures)',
    Item: OldURDItem,
};

// ---------------------------------------------------------------------------
// 3. @tanstack/react-query
// ---------------------------------------------------------------------------

function RQWrapper({ children }: { children: React.ReactNode }) {
    // lazy init — avoid constructing a new QueryClient on every render
    const clientRef = useRef<QueryClient | null>(null);
    if (clientRef.current === null) {
        clientRef.current = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                    staleTime: Infinity,
                    gcTime: 5 * 60 * 1000, // keep cache alive during benchmark
                },
            },
        });
    }
    return <QueryClientProvider client={clientRef.current}>{children}</QueryClientProvider>;
}

function RQItem({ id }: { id: number }) {
    const { data, isLoading } = useQuery({
        queryKey: ['bench', id],
        queryFn: () => fakeFetch(id),
    });
    if (isLoading) return <span>...</span>;
    return <span data-resolved>{data}</span>;
}

export const rqScenario: Scenario = {
    name: 'react-query',
    Item: RQItem,
    Wrapper: RQWrapper,
};

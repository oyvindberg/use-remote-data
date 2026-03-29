/**
 * Benchmark scenarios. Each does the same work:
 *   1. Fetch a number (5ms simulated latency)
 *   2. Render it once resolved
 *   3. Show "..." while loading
 *
 * Three approaches, each using its recommended pattern:
 *   - raw React: per-component useState + useEffect
 *   - use-remote-data: useRemoteDataMap in a parent, stores passed to children
 *   - react-query: per-component useQuery (deduplicates via QueryClient cache)
 */
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Await, useRemoteDataMap } from 'use-remote-data';
import { RemoteDataMap } from 'use-remote-data/RemoteDataMap';

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
// 1. Raw React baseline — per-component useState + useEffect
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
// 2. use-remote-data — parent creates stores, children consume via context
//
// This is the recommended URD pattern for shared data: instantiate the
// store higher in the component tree and pass it down. useRemoteDataMap
// manages all keys from a single hook. Each child calls map.get(id) to
// get a cached, stable store reference.
// ---------------------------------------------------------------------------

const URDMapContext = createContext<RemoteDataMap<number, number> | null>(null);

const loading = () => <span>...</span>;

function URDWrapper({ children }: { children: React.ReactNode }) {
    const map = useRemoteDataMap<number, number>(
        (key, signal) => fakeFetch(key)
    );
    return <URDMapContext.Provider value={map}>{children}</URDMapContext.Provider>;
}

function URDItem({ id }: { id: number }) {
    const map = useContext(URDMapContext)!;
    const store = map.get(id);
    return (
        <Await store={store} loading={loading}>
            {(v) => <span data-resolved>{v}</span>}
        </Await>
    );
}

export const urdScenario: Scenario = {
    name: 'use-remote-data',
    Item: URDItem,
    Wrapper: URDWrapper,
};

// ---------------------------------------------------------------------------
// 3. react-query — per-component useQuery, deduplicates via QueryClient
// ---------------------------------------------------------------------------

function RQWrapper({ children }: { children: React.ReactNode }) {
    const clientRef = useRef<QueryClient | null>(null);
    if (clientRef.current === null) {
        clientRef.current = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                    staleTime: Infinity,
                    gcTime: 5 * 60 * 1000,
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

// ---------------------------------------------------------------------------
// Key mapping — maps component id to a fetch key based on uniqueKeys
// ---------------------------------------------------------------------------

export function withKeyMapping(scenario: Scenario, uniqueKeys: number): Scenario {
    const MappedItem = ({ id }: { id: number }) => {
        const mappedId = id % uniqueKeys;
        return <scenario.Item id={mappedId} />;
    };
    return {
        ...scenario,
        name: scenario.name,
        Item: MappedItem,
    };
}

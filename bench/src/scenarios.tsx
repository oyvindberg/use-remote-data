/**
 * Benchmark scenarios. Each renders N items using its natural pattern:
 *   - raw React: per-component useState + useEffect
 *   - use-remote-data: useRemoteDataMap in a parent, Await for each item
 *   - react-query: QueryClientProvider + per-component useQuery
 */
import React, { useEffect, useRef, useState } from 'react';
import { Await, useRemoteDataMap } from 'use-remote-data';

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
// 1. Raw React — per-component useState + useEffect
// ---------------------------------------------------------------------------

function RawItem({ id }: { id: number }) {
    const [data, setData] = useState<number | null>(null);
    useEffect(() => {
        let cancelled = false;
        fakeFetch(id).then((v) => { if (!cancelled) setData(v); });
        return () => { cancelled = true; };
    }, [id]);
    if (data === null) return <span>...</span>;
    return <span data-resolved>{data}</span>;
}

function RawScene({ n, uniqueKeys }: { n: number; uniqueKeys: number }) {
    return (
        <>
            {Array.from({ length: n }, (_, i) => (
                <RawItem key={i} id={i % uniqueKeys} />
            ))}
        </>
    );
}

export const rawScenario: Scenario = {
    name: 'raw React (no library)',
    Scene: RawScene,
};

// ---------------------------------------------------------------------------
// 2. use-remote-data — parent owns useRemoteDataMap, renders Await directly
//
// This is the recommended pattern: the parent creates the map, then
// renders <Await store={map.get(id)}> for each item. When state changes
// the parent re-renders and all Awaits see the new data.
// ---------------------------------------------------------------------------

const loading = () => <span>...</span>;

function URDScene({ n, uniqueKeys }: { n: number; uniqueKeys: number }) {
    const map = useRemoteDataMap<number, number>(
        (key) => fakeFetch(key)
    );
    return (
        <>
            {Array.from({ length: n }, (_, i) => {
                const store = map.get(i % uniqueKeys);
                return (
                    <Await key={i} store={store} loading={loading}>
                        {(v) => <span data-resolved>{v}</span>}
                    </Await>
                );
            })}
        </>
    );
}

export const urdScenario: Scenario = {
    name: 'use-remote-data',
    Scene: URDScene,
};

// ---------------------------------------------------------------------------
// 3. react-query — QueryClientProvider + per-component useQuery
// ---------------------------------------------------------------------------

function RQItem({ id }: { id: number }) {
    const { data, isLoading } = useQuery({
        queryKey: ['bench', id],
        queryFn: () => fakeFetch(id),
    });
    if (isLoading) return <span>...</span>;
    return <span data-resolved>{data}</span>;
}

function RQScene({ n, uniqueKeys }: { n: number; uniqueKeys: number }) {
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
    return (
        <QueryClientProvider client={clientRef.current}>
            {Array.from({ length: n }, (_, i) => (
                <RQItem key={i} id={i % uniqueKeys} />
            ))}
        </QueryClientProvider>
    );
}

export const rqScenario: Scenario = {
    name: 'react-query',
    Scene: RQScene,
};

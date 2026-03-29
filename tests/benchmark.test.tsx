/**
 * Render-performance benchmark: class instances vs closure-per-render.
 *
 * Measures the full flow: hook + Await, with fetches that resolve after
 * simulated latency. Covers both reads (useRemoteData) and mutations
 * (useRemoteUpdate).
 */
import { Await, useRemoteData, useRemoteUpdate } from '../src';
import { AwaitUpdate } from '../src/AwaitUpdate';
import { render, screen, waitFor, act } from '@testing-library/react';
import React, { DependencyList, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { RemoteData } from '../src/RemoteData';
import { RemoteDataStore } from '../src/RemoteDataStore';
import { RemoteUpdateStore } from '../src/RemoteUpdateStore';
import { Result } from '../src/Result';
import { CancelTimeout } from '../src/CancelTimeout';
import { Staleness } from '../src/Staleness';
import { Failure } from '../src/Failure';
import { WeakError } from '../src/WeakError';
import { Options } from '../src/Options';
import { RemoteUpdateOptions } from '../src/RemoteUpdateOptions';
import { depsChanged } from '../src/internal/depsChanged';
import { isDefined } from '../src/internal/isDefined';

// ---------------------------------------------------------------------------
// Simulated latency
// ---------------------------------------------------------------------------

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

let fetchCounter = 0;
const fakeFetch = async (): Promise<number> => {
    await delay(5);
    return ++fetchCounter;
};

const fakeMutation = async (): Promise<string> => {
    await delay(5);
    return 'ok';
};

// ---------------------------------------------------------------------------
// Old-style Await — uses [store] dep (new object each render → runs every render)
// ---------------------------------------------------------------------------

function OldAwait<T, E>({ store, children }: {
    store: RemoteDataStore<T, E>;
    children: (value: T, isStale: boolean) => React.ReactNode;
}) {
    useEffect(store.triggerUpdate, [store]);
    return RemoteData.fold(store.current)<React.ReactElement>(
        (value, isStale) => <div>{children(value, isStale)}</div>,
        () => <span>...</span>,
        () => <span>err</span>
    );
}

// ---------------------------------------------------------------------------
// Old-style useRemoteData — closure-per-render (pre-optimisation code)
// ---------------------------------------------------------------------------

const useRemoteDataOldStyle = <T,>(
    rawRun: (signal: AbortSignal) => Promise<T>,
    options: Options<T> = {}
): RemoteDataStore<T> => {
    type K = undefined;
    const run = (_key: K, signal: AbortSignal): Promise<Result<T, never>> => rawRun(signal).then(Result.ok);

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
        if (options.debug) options.debug(`${storeName(key)} => `, data);
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
                        case 'err':
                            set(key, RemoteData.Failed([Failure.expected(result.value)], () => runAndUpdate(key, RemoteData.Pending)));
                            break;
                        case 'ok': {
                            const value = result.value;
                            const now = new Date();
                            let res: RemoteData<T, never> = RemoteData.Success(value, now);
                            if (options.refresh && !Staleness.isFresh(options.refresh.decide(res.value, res.updatedAt, now))) {
                                res = RemoteData.StaleImmediate(res);
                            }
                            set(key, res);
                        }
                    }
                })
                .catch((error: WeakError) => {
                    if (controller.signal.aborted) return;
                    if (requestVersionsRef.current.get(key) !== requestVersion) return;
                    set(key, RemoteData.Failed<never>([Failure.unexpected(error)], () => runAndUpdate(key, RemoteData.Pending)));
                });
        } catch (error: WeakError) {
            set(key, RemoteData.Failed<never>([Failure.unexpected(error)], () => runAndUpdate(key, RemoteData.Pending)));
            return Promise.resolve();
        }
    };

    const isUpdating: Map<K, boolean> = new Map();

    const triggerUpdate = (key: K): CancelTimeout => {
        if (depsChanged(depsRef.current, options.dependencies)) {
            abortControllersRef.current.forEach((c) => c.abort());
            abortControllersRef.current.clear();
            refreshHandlesRef.current.forEach(({ handle }) => clearTimeout(handle));
            refreshHandlesRef.current.clear();
            requestVersionsRef.current.forEach((v, k) => requestVersionsRef.current.set(k, v + 1));
            depsRef.current = options.dependencies;
            const refreshed = new Map<K, RemoteData<T, never>>();
            remoteDatas.forEach((rd, k) => refreshed.set(k, RemoteData.initialStateFor(rd)));
            setRemoteDatas(refreshed);
            return;
        }
        if (isUpdating.get(key)) return;
        isUpdating.set(key, true);
        const remoteData = remoteDatas.get(key) || RemoteData.Initial;
        if (remoteData.type === 'initial' || remoteData.type === 'stale-initial') {
            runAndUpdate(key, RemoteData.pendingStateFor(remoteData));
            return;
        }
        if (isDefined(options.refresh) && (remoteData.type === 'success' || remoteData.type === 'stale-immediate')) {
            const success = remoteData.type === 'success' ? remoteData : remoteData.stale;
            const staleness = options.refresh.decide(success.value, success.updatedAt, new Date());
            switch (staleness.type) {
                case 'stale': set(key, RemoteData.StaleInitial(success)); return;
                case 'fresh': return;
                case 'check-after': {
                    const existing = refreshHandlesRef.current.get(key);
                    if (existing && existing.updatedAt.getTime() === success.updatedAt.getTime()) return;
                    if (existing) clearTimeout(existing.handle);
                    const handle = setTimeout(() => {
                        refreshHandlesRef.current.delete(key);
                        set(key, RemoteData.StaleInitial(success));
                    }, staleness.millis);
                    refreshHandlesRef.current.set(key, { handle, updatedAt: success.updatedAt });
                    return;
                }
            }
        }
    };

    const key = undefined;

    return {
        storeName: storeName(key),
        get current() { return remoteDatas.get(key) || RemoteData.Initial; },
        refresh: () => {
            const timer = refreshHandlesRef.current.get(key);
            if (timer) { clearTimeout(timer.handle); refreshHandlesRef.current.delete(key); }
            abortControllersRef.current.get(key)?.abort();
            const cv = requestVersionsRef.current.get(key) ?? 0;
            requestVersionsRef.current.set(key, cv + 1);
            setRemoteDatas((old) => {
                const c = old.get(key) || RemoteData.Initial;
                const n = RemoteData.initialStateFor(c);
                const u = new Map(old);
                u.set(key, n);
                return u;
            });
        },
        triggerUpdate: () => triggerUpdate(key),
        get orNull(): RemoteDataStore<T | null, never> { return RemoteDataStore.orNull(this); },
        map<U>(fn: (value: T) => U): RemoteDataStore<U, never> { return RemoteDataStore.map(this, fn); },
    };
};

// ---------------------------------------------------------------------------
// Old-style useRemoteUpdate — closure-per-render
// ---------------------------------------------------------------------------

const useRemoteUpdateOldStyle = <T, P = void>(
    rawRun: (params: P, signal: AbortSignal) => Promise<T>,
    options?: RemoteUpdateOptions<T, never>
): RemoteUpdateStore<T, P, never> => {
    const [state, setState] = useState<RemoteData<T, never>>(RemoteData.Initial);
    const fetcherRef = useRef(rawRun);
    const optionsRef = useRef(options);
    const requestIdRef = useRef(0);
    const abortControllerRef = useRef<AbortController | null>(null);

    // old style: write during render
    fetcherRef.current = rawRun;
    optionsRef.current = options;

    useEffect(
        () => () => { abortControllerRef.current?.abort(); },
        []
    );

    // closure recreated every render
    const runFn = useCallback((params: P): Promise<void> => {
        const requestId = ++requestIdRef.current;
        abortControllerRef.current?.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;
        setState((prev) => RemoteData.pendingStateFor(prev));
        try {
            return fetcherRef.current(params, controller.signal)
                .then((value) => {
                    if (controller.signal.aborted) return;
                    if (requestIdRef.current !== requestId) return;
                    setState(RemoteData.Success(value, new Date()));
                    optionsRef.current?.refreshes?.forEach((s) => s.refresh());
                    optionsRef.current?.onSuccess?.(value);
                })
                .catch((error: WeakError) => {
                    if (controller.signal.aborted) return;
                    if (requestIdRef.current !== requestId) return;
                    setState(RemoteData.Failed<never>([Failure.unexpected(error)], () => runFn(params)));
                });
        } catch (error: WeakError) {
            setState(RemoteData.Failed<never>([Failure.unexpected(error)], () => runFn(params)));
            return Promise.resolve();
        }
    }, []);

    const reset = useCallback(() => {
        abortControllerRef.current?.abort();
        requestIdRef.current++;
        setState(RemoteData.Initial);
    }, []);

    return {
        run: runFn,
        reset,
        triggerUpdate: () => undefined,
        refresh: reset,
        get current() { return state; },
        storeName: options?.storeName,
        get orNull(): RemoteDataStore<T | null, never> { return RemoteDataStore.orNull(this); },
        map<U>(fn: (value: T) => U): RemoteDataStore<U, never> { return RemoteDataStore.map(this, fn); },
    };
};

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

const loading = () => <span>...</span>;

function OptimizedFetchItem() {
    const store = useRemoteData(fakeFetch);
    return <Await store={store} loading={loading}>{(v) => <span>{v}</span>}</Await>;
}

function ClosureFetchItem() {
    const store = useRemoteDataOldStyle(fakeFetch);
    return <OldAwait store={store}>{(v) => <span>{v}</span>}</OldAwait>;
}

function OptimizedMutationItem() {
    const store = useRemoteUpdate(fakeMutation);
    return (
        <AwaitUpdate store={store} idle={(run) => <button onClick={() => run()}>go</button>}>
            {(v) => <span>{v}</span>}
        </AwaitUpdate>
    );
}

function ClosureMutationItem() {
    const store = useRemoteUpdateOldStyle(fakeMutation);
    const current = store.current;
    switch (current.type) {
        case 'initial': return <button onClick={() => store.run()}>go</button>;
        case 'pending': return <span>...</span>;
        case 'success': return <span>{current.value}</span>;
        default: return <span>err</span>;
    }
}

function BaselineItem() {
    return <span>...</span>;
}

// ---------------------------------------------------------------------------
// Benchmark helpers
// ---------------------------------------------------------------------------

function bench(fn: () => void, iterations: number): number {
    fn(); fn(); // warmup
    const times: number[] = [];
    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        fn();
        times.push(performance.now() - start);
    }
    times.sort((a, b) => a - b);
    return times[Math.floor(times.length / 2)];
}

function rerenderBench(Item: React.FC, n: number, iters: number): number {
    let trigger: () => void;
    function Parent() {
        const [tick, setTick] = useState(0);
        trigger = () => setTick((t) => t + 1);
        return (
            <div>
                {Array.from({ length: n }, (_, i) => <Item key={i} />)}
                <span>{tick}</span>
            </div>
        );
    }
    const { unmount } = render(<Parent />);
    const ms = bench(() => { act(() => trigger()); }, iters);
    unmount();
    return ms;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const N = 1000;
const ITERS = 7;

test(`benchmark: useRemoteData — ${N} components (mount + re-render)`, () => {
    const baselineMount = bench(() => {
        const { unmount } = render(
            <div>{Array.from({ length: N }, (_, i) => <BaselineItem key={i} />)}</div>
        );
        unmount();
    }, ITERS);

    const closureMount = bench(() => {
        const { unmount } = render(
            <div>{Array.from({ length: N }, (_, i) => <ClosureFetchItem key={i} />)}</div>
        );
        unmount();
    }, ITERS);

    const optimizedMount = bench(() => {
        const { unmount } = render(
            <div>{Array.from({ length: N }, (_, i) => <OptimizedFetchItem key={i} />)}</div>
        );
        unmount();
    }, ITERS);

    const baselineRerender = rerenderBench(BaselineItem, N, ITERS);
    const closureRerender = rerenderBench(ClosureFetchItem, N, ITERS);
    const optimizedRerender = rerenderBench(OptimizedFetchItem, N, ITERS);

    const overhead = (a: number, base: number) => `+${((a / base - 1) * 100).toFixed(0)}%`;
    const hookOld = closureRerender - baselineRerender;
    const hookNew = optimizedRerender - baselineRerender;

    console.log(`\n${'='.repeat(64)}`);
    console.log(`  useRemoteData: ${N} components, median of ${ITERS}`);
    console.log(`${'='.repeat(64)}`);
    console.log(`\n  MOUNT (ms)                        time    vs baseline`);
    console.log(`    baseline (no hook)           ${baselineMount.toFixed(1).padStart(8)}`);
    console.log(`    old (closures/render)        ${closureMount.toFixed(1).padStart(8)}    ${overhead(closureMount, baselineMount)}`);
    console.log(`    new (class instances)        ${optimizedMount.toFixed(1).padStart(8)}    ${overhead(optimizedMount, baselineMount)}`);
    console.log(`\n  RE-RENDER (ms)                    time    vs baseline`);
    console.log(`    baseline (no hook)           ${baselineRerender.toFixed(1).padStart(8)}`);
    console.log(`    old (closures/render)        ${closureRerender.toFixed(1).padStart(8)}    ${overhead(closureRerender, baselineRerender)}`);
    console.log(`    new (class instances)        ${optimizedRerender.toFixed(1).padStart(8)}    ${overhead(optimizedRerender, baselineRerender)}`);
    console.log(`\n  HOOK OVERHEAD (re-render, baseline subtracted)`);
    console.log(`    old: ${hookOld.toFixed(1)} ms   new: ${hookNew.toFixed(1)} ms   ratio: ${(hookOld / Math.max(hookNew, 0.01)).toFixed(1)}x`);
    console.log(`${'='.repeat(64)}\n`);
});

test(`benchmark: useRemoteUpdate — ${N} components (mount + re-render)`, () => {
    const closureMount = bench(() => {
        const { unmount } = render(
            <div>{Array.from({ length: N }, (_, i) => <ClosureMutationItem key={i} />)}</div>
        );
        unmount();
    }, ITERS);

    const optimizedMount = bench(() => {
        const { unmount } = render(
            <div>{Array.from({ length: N }, (_, i) => <OptimizedMutationItem key={i} />)}</div>
        );
        unmount();
    }, ITERS);

    const closureRerender = rerenderBench(ClosureMutationItem, N, ITERS);
    const optimizedRerender = rerenderBench(OptimizedMutationItem, N, ITERS);

    console.log(`\n${'='.repeat(64)}`);
    console.log(`  useRemoteUpdate: ${N} components, median of ${ITERS}`);
    console.log(`${'='.repeat(64)}`);
    console.log(`\n  MOUNT (ms)                        time`);
    console.log(`    old (closures/render)        ${closureMount.toFixed(1).padStart(8)}`);
    console.log(`    new (current impl)           ${optimizedMount.toFixed(1).padStart(8)}`);
    console.log(`\n  RE-RENDER (ms)                    time    old/new`);
    console.log(`    old (closures/render)        ${closureRerender.toFixed(1).padStart(8)}`);
    console.log(`    new (current impl)           ${optimizedRerender.toFixed(1).padStart(8)}    ${(closureRerender / Math.max(optimizedRerender, 0.01)).toFixed(2)}x`);
    console.log(`${'='.repeat(64)}\n`);
});

test(`benchmark: useRemoteData — full lifecycle (fetch + resolve + render)`, async () => {
    const BATCH = 100;

    let resolveAll: Array<(v: number) => void> = [];
    const controlledFetch = (): Promise<number> =>
        new Promise<number>((resolve) => { resolveAll.push(resolve); });

    function OptItem() {
        const store = useRemoteData(controlledFetch);
        return <Await store={store} loading={loading}>{(v) => <span className="val">{v}</span>}</Await>;
    }

    function OldItem() {
        const store = useRemoteDataOldStyle(controlledFetch);
        return <OldAwait store={store}>{(v) => <span className="val">{v}</span>}</OldAwait>;
    }

    // --- old ---
    resolveAll = [];
    const t0Old = performance.now();
    const { unmount: unmount1 } = render(
        <div>{Array.from({ length: BATCH }, (_, i) => <OldItem key={i} />)}</div>
    );
    // wait for fetches to start
    await waitFor(() => expect(resolveAll.length).toBe(BATCH));
    // resolve all
    act(() => resolveAll.forEach((r, i) => r(i)));
    // wait for data to render
    await waitFor(() => {
        const els = document.querySelectorAll('.val');
        expect(els.length).toBe(BATCH);
    });
    const oldLifecycle = performance.now() - t0Old;
    unmount1();

    // --- new ---
    resolveAll = [];
    const t0New = performance.now();
    const { unmount: unmount2 } = render(
        <div>{Array.from({ length: BATCH }, (_, i) => <OptItem key={i} />)}</div>
    );
    await waitFor(() => expect(resolveAll.length).toBe(BATCH));
    act(() => resolveAll.forEach((r, i) => r(i)));
    await waitFor(() => {
        const els = document.querySelectorAll('.val');
        expect(els.length).toBe(BATCH);
    });
    const newLifecycle = performance.now() - t0New;
    unmount2();

    console.log(`\n${'='.repeat(64)}`);
    console.log(`  FULL LIFECYCLE: ${BATCH} components (mount → fetch → resolve → render)`);
    console.log(`${'='.repeat(64)}`);
    console.log(`    old (closures/render)        ${oldLifecycle.toFixed(1).padStart(8)} ms`);
    console.log(`    new (class instances)        ${newLifecycle.toFixed(1).padStart(8)} ms`);
    console.log(`    ratio:                       ${(oldLifecycle / Math.max(newLifecycle, 0.01)).toFixed(2)}x`);
    console.log(`${'='.repeat(64)}\n`);
});

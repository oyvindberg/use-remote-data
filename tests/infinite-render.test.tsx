/**
 * Tests that verify no infinite rendering occurs in common scenarios.
 *
 * Each test renders a component, lets it settle, then asserts the render
 * count stays bounded. A render count above the expected maximum fails the
 * test immediately — no timeouts needed.
 */
import {
    Await,
    RefreshStrategy,
    RemoteDataStore,
    useRemoteData,
    useRemoteUpdate,
} from '../src';
import { useSharedRemoteData, SharedStoreProvider } from '../src/SharedStoreProvider';
import { AwaitUpdate } from '../src/AwaitUpdate';
import { fireEvent, render, screen, waitFor, act } from '@testing-library/react';
import React, { useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Track render count inside a component */
function useRenderCount(): React.RefObject<number> {
    const count = useRef(0);
    count.current++;
    return count;
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SharedStoreProvider>{children}</SharedStoreProvider>
);

// ---------------------------------------------------------------------------
// useRemoteData scenarios
// ---------------------------------------------------------------------------

test('no infinite renders: basic fetch → success', async () => {
    let renderCount = 0;

    const Test = () => {
        renderCount++;
        const store = useRemoteData(() => Promise.resolve(42));
        return <Await store={store}>{(v) => <span>val: {v}</span>}</Await>;
    };

    render(<Test />);
    await waitFor(() => screen.getByText('val: 42'));

    // Initial + Pending + Success = ~3 renders (React may double in strict mode)
    expect(renderCount).toBeLessThan(10);
});

test('no infinite renders: fetch failure → retry → success', async () => {
    let renderCount = 0;
    let attempt = 0;

    const Test = () => {
        renderCount++;
        const store = useRemoteData(() => {
            attempt++;
            if (attempt === 1) return Promise.reject(new Error('fail'));
            return Promise.resolve(99);
        });
        return (
            <Await
                store={store}
                error={({ retry }) => (
                    <button onClick={() => retry()}>retry</button>
                )}
            >
                {(v) => <span>val: {v}</span>}
            </Await>
        );
    };

    render(<Test />);
    await waitFor(() => screen.getByText('retry'));

    const countBeforeRetry = renderCount;
    fireEvent.click(screen.getByText('retry'));
    await waitFor(() => screen.getByText('val: 99'));

    // retry should add ~2-3 renders, not spiral
    expect(renderCount - countBeforeRetry).toBeLessThan(10);
});

test('no infinite renders: parent re-renders with stable data', async () => {
    let childRenderCount = 0;

    const Child = () => {
        childRenderCount++;
        const store = useRemoteData(() => Promise.resolve('hello'));
        return <Await store={store}>{(v) => <span>{v}</span>}</Await>;
    };

    const Parent = () => {
        const [tick, setTick] = useState(0);
        return (
            <div>
                <button onClick={() => setTick((t) => t + 1)}>tick</button>
                <Child />
                <span data-testid="tick">{tick}</span>
            </div>
        );
    };

    render(<Parent />);
    await waitFor(() => screen.getByText('hello'));

    const countAfterSettle = childRenderCount;

    // 10 parent re-renders
    for (let i = 0; i < 10; i++) {
        fireEvent.click(screen.getByText('tick'));
    }
    await waitFor(() => expect(screen.getByTestId('tick').textContent).toBe('10'));

    // Child re-renders but should not cause extra cascades.
    // 10 parent ticks → at most 10 child re-renders + a few from effects
    expect(childRenderCount - countAfterSettle).toBeLessThan(25);
});

test('no infinite renders: dependency change triggers re-fetch', async () => {
    let renderCount = 0;
    let fetchCount = 0;

    const Inner = ({ dep }: { dep: number }) => {
        renderCount++;
        const store = useRemoteData(
            () => {
                fetchCount++;
                return Promise.resolve(dep * 10);
            },
            { dependencies: [dep] }
        );
        return <Await store={store}>{(v) => <span>val: {v}</span>}</Await>;
    };

    const Outer = () => {
        const [dep, setDep] = useState(1);
        return (
            <div>
                <button onClick={() => setDep(2)}>change</button>
                <Inner dep={dep} />
            </div>
        );
    };

    render(<Outer />);
    await waitFor(() => screen.getByText('val: 10'));

    const countBefore = renderCount;
    fireEvent.click(screen.getByText('change'));
    await waitFor(() => screen.getByText('val: 20'));

    // dep change → reset → re-fetch → success = ~3-4 renders
    expect(renderCount - countBefore).toBeLessThan(15);
    expect(fetchCount).toBe(2);
});

test('no infinite renders: refresh=stale (immediate staleness)', async () => {
    let renderCount = 0;
    let fetchCount = 0;

    const Test = () => {
        renderCount++;
        const store = useRemoteData(
            () => {
                fetchCount++;
                return Promise.resolve(fetchCount);
            },
            {
                // Data is always immediately stale — this INTENTIONALLY re-fetches
                // continuously. The test verifies it doesn't cause a synchronous
                // CPU hang (each cycle goes through Pending, which is a no-op in
                // triggerUpdate, breaking any synchronous cascade).
                refresh: RefreshStrategy.afterMillis(0),
            }
        );
        return (
            <Await store={store}>
                {(v, isStale) => (
                    <span>
                        val: {v}, stale: {String(isStale)}
                    </span>
                )}
            </Await>
        );
    };

    const { unmount } = render(<Test />);

    // Should render data (not hang). afterMillis(0) causes continuous re-fetching,
    // but each cycle is async (Promise.resolve → microtask), not a synchronous loop.
    await waitFor(() => {
        expect(fetchCount).toBeGreaterThanOrEqual(2);
    });

    // We reached here → no synchronous infinite loop. Clean up.
    unmount();

    expect(renderCount).toBeGreaterThan(3); // went through multiple cycles
});

test('no infinite renders: refresh=check-after with parent re-renders', async () => {
    let renderCount = 0;

    const Child = () => {
        renderCount++;
        const store = useRemoteData(() => Promise.resolve('data'), {
            refresh: RefreshStrategy.afterMillis(60_000), // 60s, won't fire during test
        });
        return <Await store={store}>{(v) => <span>{v}</span>}</Await>;
    };

    const Parent = () => {
        const [tick, setTick] = useState(0);
        return (
            <div>
                <button onClick={() => setTick((t) => t + 1)}>tick</button>
                <Child />
            </div>
        );
    };

    render(<Parent />);
    await waitFor(() => screen.getByText('data'));
    const countAfterSettle = renderCount;

    // 20 rapid parent re-renders
    for (let i = 0; i < 20; i++) {
        fireEvent.click(screen.getByText('tick'));
    }

    // Wait for effects to flush
    await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
    });

    // Should be ~20 re-renders (one per parent tick), not exponential
    expect(renderCount - countAfterSettle).toBeLessThan(50);
});

test('no infinite renders: multiple Await sharing same store', async () => {
    let renderCount = 0;

    const Test = () => {
        renderCount++;
        const store = useRemoteData(() => Promise.resolve(7));
        return (
            <div>
                <Await store={store}>{(v) => <span>a: {v}</span>}</Await>
                <Await store={store}>{(v) => <span>b: {v}</span>}</Await>
                <Await store={store}>{(v) => <span>c: {v}</span>}</Await>
            </div>
        );
    };

    render(<Test />);
    await waitFor(() => screen.getByText('a: 7'));
    await waitFor(() => screen.getByText('b: 7'));
    await waitFor(() => screen.getByText('c: 7'));

    expect(renderCount).toBeLessThan(10);
});

test('no infinite renders: store.orNull renders immediately', async () => {
    let renderCount = 0;

    const Test = () => {
        renderCount++;
        const store = useRemoteData(() => new Promise<string>(() => {})); // never resolves
        const orNullStore = store.orNull;
        return <Await store={orNullStore}>{(v) => <span>val: {String(v)}</span>}</Await>;
    };

    render(<Test />);
    await waitFor(() => screen.getByText('val: null'));

    // orNull should immediately succeed with null, no loading state
    expect(renderCount).toBeLessThan(10);
});

test('no infinite renders: RemoteDataStore.all with mixed states', async () => {
    let renderCount = 0;
    let slowResolve: ((v: string) => void) | null = null;

    const Test = () => {
        renderCount++;
        const fast = useRemoteData(() => Promise.resolve('fast'));
        const slow = useRemoteData(
            () => new Promise<string>((r) => { slowResolve = r; })
        );
        const combined = RemoteDataStore.all(fast, slow);
        return (
            <Await store={combined} loading={() => <span>loading</span>}>
                {([a, b]) => <span>done: {a},{b}</span>}
            </Await>
        );
    };

    render(<Test />);
    await waitFor(() => screen.getByText('loading'));

    const countBeforeResolve = renderCount;
    act(() => slowResolve!('slow'));
    await waitFor(() => screen.getByText('done: fast,slow'));

    expect(renderCount - countBeforeResolve).toBeLessThan(10);
});

// ---------------------------------------------------------------------------
// useRemoteUpdate scenarios
// ---------------------------------------------------------------------------

test('no infinite renders: mutation run → success', async () => {
    let renderCount = 0;

    const Test = () => {
        renderCount++;
        const store = useRemoteUpdate(() => Promise.resolve('saved'));
        return (
            <AwaitUpdate
                store={store}
                idle={(run) => <button onClick={() => run()}>go</button>}
            >
                {(v) => <span>result: {v}</span>}
            </AwaitUpdate>
        );
    };

    render(<Test />);
    await waitFor(() => screen.getByText('go'));
    const countBefore = renderCount;

    fireEvent.click(screen.getByText('go'));
    await waitFor(() => screen.getByText('result: saved'));

    // Idle → Pending → Success = ~3 renders
    expect(renderCount - countBefore).toBeLessThan(10);
});

test('no infinite renders: mutation with refreshes', async () => {
    let renderCount = 0;
    let fetchCount = 0;

    const Test = () => {
        renderCount++;
        const data = useRemoteData(() => {
            fetchCount++;
            return Promise.resolve(fetchCount);
        });
        const mutation = useRemoteUpdate(() => Promise.resolve('ok'), {
            refreshes: [data],
        });

        return (
            <div>
                <Await store={data}>{(v) => <span>data: {v}</span>}</Await>
                <AwaitUpdate
                    store={mutation}
                    idle={(run) => <button onClick={() => run()}>mutate</button>}
                >
                    {() => <span>mutated</span>}
                </AwaitUpdate>
            </div>
        );
    };

    render(<Test />);
    await waitFor(() => screen.getByText('data: 1'));

    const countBefore = renderCount;
    fireEvent.click(screen.getByText('mutate'));
    await waitFor(() => screen.getByText('data: 2'));

    // mutation success → refresh data → re-fetch → success
    expect(renderCount - countBefore).toBeLessThan(15);
});

// ---------------------------------------------------------------------------
// useSharedRemoteData scenarios
// ---------------------------------------------------------------------------

test('no infinite renders: shared store basic', async () => {
    let renderCountA = 0;
    let renderCountB = 0;
    let fetchCount = 0;

    const A = () => {
        renderCountA++;
        const store = useSharedRemoteData('shared-basic', () => {
            fetchCount++;
            return Promise.resolve('shared');
        });
        return <Await store={store}>{(v) => <span>A: {v}</span>}</Await>;
    };

    const B = () => {
        renderCountB++;
        const store = useSharedRemoteData('shared-basic', () => {
            fetchCount++;
            return Promise.resolve('shared');
        });
        return <Await store={store}>{(v) => <span>B: {v}</span>}</Await>;
    };

    render(
        <SharedStoreProvider>
            <A />
            <B />
        </SharedStoreProvider>
    );

    await waitFor(() => screen.getByText('A: shared'));
    await waitFor(() => screen.getByText('B: shared'));

    expect(fetchCount).toBe(1);
    expect(renderCountA).toBeLessThan(10);
    expect(renderCountB).toBeLessThan(10);
});

test('no infinite renders: shared store with parent re-renders', async () => {
    let childRenderCount = 0;

    const Child = () => {
        childRenderCount++;
        const store = useSharedRemoteData('shared-rerender', () =>
            Promise.resolve('data')
        );
        return <Await store={store}>{(v) => <span>{v}</span>}</Await>;
    };

    const Parent = () => {
        const [tick, setTick] = useState(0);
        return (
            <SharedStoreProvider>
                <button onClick={() => setTick((t) => t + 1)}>tick</button>
                <Child />
                <span data-testid="tick">{tick}</span>
            </SharedStoreProvider>
        );
    };

    render(<Parent />);
    await waitFor(() => screen.getByText('data'));
    const countAfterSettle = childRenderCount;

    for (let i = 0; i < 10; i++) {
        fireEvent.click(screen.getByText('tick'));
    }

    await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
    });

    // 10 parent ticks → ~10 child re-renders, no cascading
    expect(childRenderCount - countAfterSettle).toBeLessThan(25);
});

test('no infinite renders: shared store refresh', async () => {
    let renderCount = 0;
    let fetchCount = 0;

    const Test = () => {
        renderCount++;
        const store = useSharedRemoteData('shared-refresh', () => {
            fetchCount++;
            return Promise.resolve(`v${fetchCount}`);
        });
        return (
            <div>
                <Await store={store}>{(v) => <span>val: {v}</span>}</Await>
                <button onClick={() => store.refresh()}>refresh</button>
            </div>
        );
    };

    render(<Test />, { wrapper });
    await waitFor(() => screen.getByText('val: v1'));
    const countBefore = renderCount;

    fireEvent.click(screen.getByText('refresh'));
    await waitFor(() => screen.getByText('val: v2'));

    expect(renderCount - countBefore).toBeLessThan(10);
    expect(fetchCount).toBe(2);
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

test('no infinite renders: unmount during fetch', async () => {
    let renderCount = 0;
    let resolvePromise: ((v: number) => void) | null = null;

    const Test = () => {
        renderCount++;
        const store = useRemoteData(
            () => new Promise<number>((r) => { resolvePromise = r; })
        );
        return <Await store={store}>{(v) => <span>{v}</span>}</Await>;
    };

    const { unmount } = render(<Test />);
    await waitFor(() => screen.getByText('...'));

    unmount();

    // Resolve after unmount — should not cause errors or renders
    act(() => resolvePromise!(42));

    await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
    });

    // Only Initial + Pending renders before unmount
    expect(renderCount).toBeLessThan(10);
});

test('no infinite renders: rapid dependency changes', async () => {
    let renderCount = 0;

    const Inner = ({ dep }: { dep: number }) => {
        renderCount++;
        const store = useRemoteData(() => Promise.resolve(dep), {
            dependencies: [dep],
        });
        return <Await store={store}>{(v) => <span>val: {v}</span>}</Await>;
    };

    const Outer = () => {
        const [dep, setDep] = useState(0);
        return (
            <div>
                <button onClick={() => setDep((d) => d + 1)}>inc</button>
                <Inner dep={dep} />
            </div>
        );
    };

    render(<Outer />);
    await waitFor(() => screen.getByText('val: 0'));

    // Rapid-fire 10 dep changes
    for (let i = 0; i < 10; i++) {
        fireEvent.click(screen.getByText('inc'));
    }

    await waitFor(() => screen.getByText('val: 10'));

    // Should not explode — each dep change aborts previous and restarts.
    // 10 changes × ~3 renders each + some batching = bounded
    expect(renderCount).toBeLessThan(80);
});

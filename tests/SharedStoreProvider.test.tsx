import {
    Await,
    RefreshStrategy,
    RemoteDataStore,
    SharedStoreProvider,
    useSharedRemoteData,
    useRemoteData,
} from '../src';
import { fireEvent, render, screen, waitFor, act } from '@testing-library/react';
import { type ReactNode, useState } from 'react';

function wrapper({ children }: { children: ReactNode }) {
    return <SharedStoreProvider>{children}</SharedStoreProvider>;
}

test('should throw without provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const Test = () => {
        const store = useSharedRemoteData('x', () => Promise.resolve(1));
        return <span>{store.current.type}</span>;
    };
    expect(() => render(<Test />)).toThrow('useSharedRemoteData must be used inside <SharedStoreProvider>');
    spy.mockRestore();
});

test('should handle success', async () => {
    const Test = () => {
        const store = useSharedRemoteData('user', () => Promise.resolve('Alice'));
        return <Await store={store}>{(val) => <span>name: {val}</span>}</Await>;
    };

    render(<Test />, { wrapper });
    await waitFor(() => screen.getByText('name: Alice'));
});

test('should handle failure and retry', async () => {
    let shouldFail = true;
    const fetcher = (): Promise<string> => {
        if (shouldFail) {
            shouldFail = false;
            return Promise.reject(new Error('boom'));
        }
        return Promise.resolve('recovered');
    };

    const Test = () => {
        const store = useSharedRemoteData('flaky', fetcher);
        return <Await store={store}>{(val) => <span>val: {val}</span>}</Await>;
    };

    render(<Test />, { wrapper });
    await waitFor(() => screen.getByText('Error: boom'));
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => screen.getByText('val: recovered'));
});

test('should deduplicate fetches by name', async () => {
    let fetchCount = 0;
    const fetcher = (): Promise<string> => {
        fetchCount++;
        return Promise.resolve('shared data');
    };

    const A = () => {
        const store = useSharedRemoteData('dedup', fetcher);
        return <Await store={store}>{(val) => <span>A: {val}</span>}</Await>;
    };
    const B = () => {
        const store = useSharedRemoteData('dedup', fetcher);
        return <Await store={store}>{(val) => <span>B: {val}</span>}</Await>;
    };

    render(
        <SharedStoreProvider>
            <A />
            <B />
        </SharedStoreProvider>
    );

    await waitFor(() => screen.getByText('A: shared data'));
    await waitFor(() => screen.getByText('B: shared data'));
    expect(fetchCount).toBe(1);
});

test('late joiner should get existing state without re-fetch', async () => {
    let fetchCount = 0;
    const fetcher = (): Promise<string> => {
        fetchCount++;
        return Promise.resolve(`fetch #${fetchCount}`);
    };

    const A = () => {
        const store = useSharedRemoteData('late', fetcher);
        return <Await store={store}>{(val) => <span>A: {val}</span>}</Await>;
    };
    const B = () => {
        const store = useSharedRemoteData('late', fetcher);
        return <Await store={store}>{(val) => <span>B: {val}</span>}</Await>;
    };

    const Wrapper = () => {
        const [showB, setShowB] = useState(false);
        return (
            <SharedStoreProvider>
                <A />
                {showB && <B />}
                <button onClick={() => setShowB(true)}>show B</button>
            </SharedStoreProvider>
        );
    };

    render(<Wrapper />);
    await waitFor(() => screen.getByText('A: fetch #1'));
    expect(fetchCount).toBe(1);

    fireEvent.click(screen.getByText('show B'));
    await waitFor(() => screen.getByText('B: fetch #1'));
    // B got existing data, no second fetch
    expect(fetchCount).toBe(1);
});

test('should cleanup on last unmount and re-fetch on remount', async () => {
    let fetchCount = 0;
    const fetcher = (): Promise<string> => {
        fetchCount++;
        return Promise.resolve(`fetch #${fetchCount}`);
    };

    const Test = () => {
        const store = useSharedRemoteData('cleanup', fetcher);
        return <Await store={store}>{(val) => <span>val: {val}</span>}</Await>;
    };

    const { unmount } = render(<Test />, { wrapper });
    await waitFor(() => screen.getByText('val: fetch #1'));
    expect(fetchCount).toBe(1);

    unmount();

    // Remount — entry was cleaned up, should re-fetch
    render(<Test />, { wrapper });
    await waitFor(() => screen.getByText('val: fetch #2'));
    expect(fetchCount).toBe(2);
});

test('gcTime should keep entry alive during grace period', async () => {
    let fetchCount = 0;
    const fetcher = (): Promise<number> => {
        fetchCount++;
        return Promise.resolve(fetchCount);
    };

    const Test = () => {
        const store = useSharedRemoteData('gc', fetcher, { gcTime: 500 });
        return <Await store={store}>{(val) => <span>val: {val}</span>}</Await>;
    };

    const Toggler = () => {
        const [show, setShow] = useState(true);
        return (
            <SharedStoreProvider>
                {show && <Test />}
                <button onClick={() => setShow((s) => !s)}>toggle</button>
            </SharedStoreProvider>
        );
    };

    render(<Toggler />);
    await waitFor(() => screen.getByText('val: 1'));
    expect(fetchCount).toBe(1);

    // Unmount
    fireEvent.click(screen.getByText('toggle'));
    expect(screen.queryByText(/val:/)).toBeNull();

    // Remount quickly (within gcTime) — should NOT re-fetch
    fireEvent.click(screen.getByText('toggle'));
    await waitFor(() => screen.getByText('val: 1'));
    expect(fetchCount).toBe(1);
});

test('gcTime should expire and allow re-fetch', async () => {
    let fetchCount = 0;
    const fetcher = (): Promise<number> => {
        fetchCount++;
        return Promise.resolve(fetchCount);
    };

    const Test = () => {
        const store = useSharedRemoteData('gc-expire', fetcher, { gcTime: 50 });
        return <Await store={store}>{(val) => <span>val: {val}</span>}</Await>;
    };

    const Toggler = () => {
        const [show, setShow] = useState(true);
        return (
            <SharedStoreProvider>
                {show && <Test />}
                <button onClick={() => setShow((s) => !s)}>toggle</button>
            </SharedStoreProvider>
        );
    };

    render(<Toggler />);
    await waitFor(() => screen.getByText('val: 1'));

    // Unmount
    fireEvent.click(screen.getByText('toggle'));

    // Wait past gcTime
    await act(async () => {
        await new Promise((r) => setTimeout(r, 100));
    });

    // Remount — entry was GC'd, should re-fetch
    fireEvent.click(screen.getByText('toggle'));
    await waitFor(() => screen.getByText('val: 2'));
    expect(fetchCount).toBe(2);
});

test('should abort in-flight request on cleanup', async () => {
    let receivedSignal: AbortSignal | undefined;
    const fetcher = (signal: AbortSignal): Promise<string> => {
        receivedSignal = signal;
        return new Promise(() => {}); // never resolves
    };

    const Test = () => {
        const store = useSharedRemoteData('abort', fetcher);
        return <Await store={store}>{(val) => <span>{val}</span>}</Await>;
    };

    const rendered = render(<Test />, { wrapper });
    await waitFor(() => expect(receivedSignal).toBeInstanceOf(AbortSignal));
    expect(receivedSignal!.aborted).toBe(false);

    rendered.unmount();
    expect(receivedSignal!.aborted).toBe(true);
});

test('refresh should work with shared stores', async () => {
    let fetchCount = 0;
    const fetcher = (): Promise<number> => {
        fetchCount++;
        return Promise.resolve(fetchCount);
    };

    const Test = () => {
        const store = useSharedRemoteData('refreshing', fetcher, {
            refresh: RefreshStrategy.afterMillis(10),
        });
        return (
            <Await store={store}>
                {(num, isStale) => (
                    <span>
                        num: {num}, isStale: {isStale.toString()}
                    </span>
                )}
            </Await>
        );
    };

    render(<Test />, { wrapper });
    await waitFor(() => screen.getByText('num: 1, isStale: false'));
    await waitFor(() => screen.getByText('num: 2, isStale: false'));
});

test('refresh() from one subscriber should update all', async () => {
    let fetchCount = 0;
    const fetcher = (): Promise<string> => {
        fetchCount++;
        return Promise.resolve(`fetch #${fetchCount}`);
    };

    const A = () => {
        const store = useSharedRemoteData('refresh-all', fetcher);
        return (
            <div>
                <Await store={store}>{(val) => <span>A: {val}</span>}</Await>
                <button onClick={() => store.refresh()}>refresh</button>
            </div>
        );
    };
    const B = () => {
        const store = useSharedRemoteData('refresh-all', fetcher);
        return <Await store={store}>{(val) => <span>B: {val}</span>}</Await>;
    };

    render(
        <SharedStoreProvider>
            <A />
            <B />
        </SharedStoreProvider>
    );

    await waitFor(() => screen.getByText('A: fetch #1'));
    await waitFor(() => screen.getByText('B: fetch #1'));

    fireEvent.click(screen.getByText('refresh'));

    await waitFor(() => screen.getByText('A: fetch #2'));
    await waitFor(() => screen.getByText('B: fetch #2'));
});

test('should work with RemoteDataStore.all()', async () => {
    const Test = () => {
        const sharedStore = useSharedRemoteData('combine-shared', () => Promise.resolve('shared'));
        const localStore = useRemoteData(() => Promise.resolve('local'));
        const combined = RemoteDataStore.all(sharedStore, localStore);
        return (
            <Await store={combined}>
                {([a, b]) => (
                    <span>
                        {a} + {b}
                    </span>
                )}
            </Await>
        );
    };

    render(<Test />, { wrapper });
    await waitFor(() => screen.getByText('shared + local'));
});

test('store.map() should work', async () => {
    const Test = () => {
        const store = useSharedRemoteData('map-test', () => Promise.resolve(42));
        const mapped = store.map((n) => n * 2);
        return <Await store={mapped}>{(val) => <span>doubled: {val}</span>}</Await>;
    };

    render(<Test />, { wrapper });
    await waitFor(() => screen.getByText('doubled: 84'));
});

test('store.orNull should work', async () => {
    const Test = () => {
        const store = useSharedRemoteData('ornull-test', () =>
            new Promise<string>((resolve) => setTimeout(() => resolve('loaded'), 50))
        );
        const orNull = store.orNull;
        return (
            <Await store={orNull}>
                {(val) => <span>value: {val === null ? 'null' : val}</span>}
            </Await>
        );
    };

    render(<Test />, { wrapper });
    // orNull renders immediately with null
    await waitFor(() => screen.getByText('value: null'));
    // then switches to real data
    await waitFor(() => screen.getByText('value: loaded'));
});

test('multiple independent shared stores should not interfere', async () => {
    const Test = () => {
        const storeA = useSharedRemoteData('independent-a', () => Promise.resolve('alpha'));
        const storeB = useSharedRemoteData('independent-b', () => Promise.resolve('beta'));
        return (
            <div>
                <Await store={storeA}>{(val) => <span>A: {val}</span>}</Await>
                <Await store={storeB}>{(val) => <span>B: {val}</span>}</Await>
            </div>
        );
    };

    render(<Test />, { wrapper });
    await waitFor(() => screen.getByText('A: alpha'));
    await waitFor(() => screen.getByText('B: beta'));
});

test('initialData should pre-seed stores', async () => {
    let fetchCount = 0;
    const fetcher = (): Promise<string> => {
        fetchCount++;
        return Promise.resolve(`fetched #${fetchCount}`);
    };

    const Test = () => {
        const store = useSharedRemoteData('seeded', fetcher);
        return <Await store={store}>{(val) => <span>val: {val}</span>}</Await>;
    };

    render(
        <SharedStoreProvider initialData={{ seeded: 'from server' }}>
            <Test />
        </SharedStoreProvider>
    );

    // Should render immediately with server data, no fetch
    await waitFor(() => screen.getByText('val: from server'));
    // Wait a tick to confirm no fetch happened
    await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
    });
    expect(fetchCount).toBe(0);
});

test('initialData with refresh should schedule refresh', async () => {
    let fetchCount = 0;
    const fetcher = (): Promise<string> => {
        fetchCount++;
        return Promise.resolve(`fetched #${fetchCount}`);
    };

    const Test = () => {
        const store = useSharedRemoteData('seeded-refresh', fetcher, {
            refresh: RefreshStrategy.afterMillis(10),
        });
        return <Await store={store}>{(val) => <span>val: {val}</span>}</Await>;
    };

    render(
        <SharedStoreProvider initialData={{ 'seeded-refresh': 'from server' }}>
            <Test />
        </SharedStoreProvider>
    );

    // Should render immediately with server data
    await waitFor(() => screen.getByText('val: from server'));

    // Refresh should kick in and replace with fetched data
    await waitFor(() => screen.getByText('val: fetched #1'));
});

test('dev warning for mismatched fetcher', async () => {
    const warnings: string[] = [];
    const debug = (msg: string) => warnings.push(msg);

    const fetcherA = () => Promise.resolve('a');
    const fetcherB = () => Promise.resolve('b');

    const A = () => {
        const store = useSharedRemoteData('mismatch', fetcherA, { debug });
        return <Await store={store}>{(val) => <span>A: {val}</span>}</Await>;
    };
    const B = () => {
        const store = useSharedRemoteData('mismatch', fetcherB, { debug });
        return <Await store={store}>{(val) => <span>B: {val}</span>}</Await>;
    };

    render(
        <SharedStoreProvider>
            <A />
            <B />
        </SharedStoreProvider>
    );

    await waitFor(() => screen.getByText('A: a'));
    // B should use A's fetcher (first registrant wins)
    await waitFor(() => screen.getByText('B: a'));

    expect(warnings.some((w) => w.includes('different fetcher reference'))).toBe(true);
});

test('storeName should be the name', async () => {
    let captured: string | undefined;
    const Test = () => {
        const store = useSharedRemoteData('my-store', () => Promise.resolve(1));
        captured = store.storeName;
        return <Await store={store}>{(val) => <span>{val}</span>}</Await>;
    };

    render(<Test />, { wrapper });
    await waitFor(() => screen.getByText('1'));
    expect(captured).toBe('my-store');
});

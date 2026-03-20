import { Await, RefreshStrategy, RemoteDataStore, useRemoteData, useRemoteUpdate } from '../src';
import { AwaitUpdate } from '../src/AwaitUpdate';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';

class TestPromise {
    i = 0;
    next = (): Promise<number> => {
        this.i += 1;
        return Promise.resolve(this.i);
    };
}

test('should handle success', async () => {
    const testPromise = new TestPromise();
    const Test: React.FC = () => {
        const store = useRemoteData(testPromise.next);
        return <Await store={store}>{(num) => <span>num: {num}</span>}</Await>;
    };

    render(<Test />);

    await waitFor(() => screen.getByText('num: 1'));
});

test('should handle failure to create promise', async () => {
    const Test: React.FC = () => {
        const store = useRemoteData<number>(() => {
            throw new Error('foo');
        });
        return <Await store={store}>{(num) => <span>num: {num}</span>}</Await>;
    };

    render(<Test />);

    await waitFor(() => screen.getByText('Error: foo'));
});

test('should handle successes', async () => {
    const testPromise = new TestPromise();
    const Test: React.FC = () => {
        const store1 = useRemoteData(testPromise.next);
        const store2 = useRemoteData(testPromise.next);
        const store = RemoteDataStore.all(store1, store2);
        return (
            <Await store={store}>
                {([num1, num2]) => (
                    <span>
                        nums: {num1} and {num2}
                    </span>
                )}
            </Await>
        );
    };

    render(<Test />);

    await waitFor(() => screen.getByText('nums: 1 and 2'));
});

test('should handle failure and retries', async () => {
    const error = new Error('foo');

    let succeed = false;
    const testPromise = (): Promise<string> =>
        new Promise((resolve, reject) => {
            if (succeed) resolve('a');
            else {
                succeed = true;
                reject(error);
            }
        });

    const Test: React.FC = () => {
        const store = useRemoteData(testPromise);
        return <Await store={store}>{(char) => <span>char: {char}</span>}</Await>;
    };

    render(<Test />);
    await waitFor(() => screen.getByText('Error: foo'));
    const button = await waitFor(() => screen.getByRole('button'));
    fireEvent.click(button);
    await waitFor(() => screen.getByText('char: a'));
});

test('refresh: afterMillis should work', async () => {
    const testPromise = new TestPromise();
    const Test: React.FC = () => {
        const store = useRemoteData(testPromise.next, { refresh: RefreshStrategy.afterMillis(10) });
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
    render(<Test />);

    await waitFor(() => screen.getByText('...'));
    await waitFor(() => screen.getByText('num: 1, isStale: false'));
    await waitFor(() => screen.getByText('num: 1, isStale: true'));
    await waitFor(() => screen.getByText('num: 2, isStale: false'));
});

test('refresh: polling should work', async () => {
    const testPromise = new TestPromise();
    const Test: React.FC = () => {
        const store = useRemoteData(testPromise.next, {
            refresh: RefreshStrategy.pollUntil((x: number) => x >= 2, 10),
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
    render(<Test />);

    await waitFor(() => screen.getByText('...'));
    await waitFor(() => screen.getByText('num: 1, isStale: true'));
    await waitFor(() => screen.getByText('num: 2, isStale: false'));
});

test('refresh: polling should stop on unmount', async () => {
    class FailAtTwo {
        i = 0;
        next = (): Promise<number> => {
            this.i += 1;
            if (this.i == 2) {
                Promise.reject(new Error('should not reach 2'));
            }
            return Promise.resolve(this.i);
        };
    }

    const messages: string[] = [];
    const testPromise = new FailAtTwo();
    const Test: React.FC = () => {
        const store = useRemoteData(testPromise.next, {
            refresh: RefreshStrategy.pollUntil(() => false, 10),
            debug: (str) => messages.push(str),
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
    const rendered = render(<Test />);

    await waitFor(() => screen.getByText('...'));
    await waitFor(() => screen.getByText('num: 1, isStale: true'));
    rendered.unmount();
    if (testPromise.i == 2) throw 'polling did not stop';
    expect(messages).toContain(`undefined: cancelled refresh on unmount`);
});

test('should pass AbortSignal to fetch function', async () => {
    let receivedSignal: AbortSignal | undefined;
    const fetcher = (signal: AbortSignal): Promise<string> => {
        receivedSignal = signal;
        return Promise.resolve('ok');
    };

    const Test: React.FC = () => {
        const store = useRemoteData(fetcher);
        return <Await store={store}>{(val) => <span>{val}</span>}</Await>;
    };

    render(<Test />);
    await waitFor(() => screen.getByText('ok'));
    expect(receivedSignal).toBeInstanceOf(AbortSignal);
    expect(receivedSignal!.aborted).toBe(false);
});

test('should abort in-flight request on unmount', async () => {
    let receivedSignal: AbortSignal | undefined;
    const fetcher = (signal: AbortSignal): Promise<string> => {
        receivedSignal = signal;
        return new Promise(() => {}); // never resolves
    };

    const Test: React.FC = () => {
        const store = useRemoteData(fetcher);
        return <Await store={store}>{(val) => <span>{val}</span>}</Await>;
    };

    const rendered = render(<Test />);
    await waitFor(() => expect(receivedSignal).toBeInstanceOf(AbortSignal));
    expect(receivedSignal!.aborted).toBe(false);
    rendered.unmount();
    expect(receivedSignal!.aborted).toBe(true);
});

test('should abort previous request and discard stale response on dependency change', async () => {
    const signals: AbortSignal[] = [];
    const resolvers: Array<(value: string) => void> = [];

    const fetcher = (signal: AbortSignal): Promise<string> => {
        signals.push(signal);
        return new Promise((resolve) => {
            resolvers.push(resolve);
        });
    };

    const Test: React.FC<{ dep: number }> = ({ dep }) => {
        const store = useRemoteData(fetcher, { dependencies: [dep] });
        return <Await store={store}>{(val) => <span>value: {val}</span>}</Await>;
    };

    const Wrapper: React.FC = () => {
        const [dep, setDep] = useState(1);
        return (
            <div>
                <button onClick={() => setDep(2)}>change dep</button>
                <Test dep={dep} />
            </div>
        );
    };

    render(<Wrapper />);

    // wait for first fetch to start
    await waitFor(() => expect(signals.length).toBe(1));
    expect(signals[0].aborted).toBe(false);

    // change dependency before first fetch completes
    fireEvent.click(screen.getByText('change dep'));

    // wait for second fetch to start
    await waitFor(() => expect(signals.length).toBe(2));

    // first signal should be aborted
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);

    // resolve both - only second should be used
    resolvers[0]('stale');
    resolvers[1]('fresh');

    await waitFor(() => screen.getByText('value: fresh'));
    expect(screen.queryByText('value: stale')).toBeNull();
});

test('should abort in-flight request when refresh() is called via mutation', async () => {
    let readSignal: AbortSignal | undefined;
    let fetchCount = 0;
    const fetchData = (signal: AbortSignal): Promise<string> => {
        readSignal = signal;
        fetchCount++;
        return new Promise((resolve) => setTimeout(() => resolve(`fetch #${fetchCount}`), 50));
    };

    const Test: React.FC = () => {
        const readStore = useRemoteData(fetchData);
        const mutateStore = useRemoteUpdate(() => Promise.resolve('mutated'), {
            refreshes: [readStore],
        });
        return (
            <div>
                <Await store={readStore}>{(value) => <span>read: {value}</span>}</Await>
                <button onClick={() => mutateStore.run()}>Mutate</button>
                <AwaitUpdate store={mutateStore}>{(value) => <span>write: {value}</span>}</AwaitUpdate>
            </div>
        );
    };

    render(<Test />);
    await waitFor(() => screen.getByText('read: fetch #1'));
    expect(readSignal!.aborted).toBe(false);

    const signalBeforeMutation = readSignal;
    fireEvent.click(screen.getByText('Mutate'));
    await waitFor(() => screen.getByText('write: mutated'));

    // the signal from the first fetch should have been aborted when refresh() was called
    expect(signalBeforeMutation!.aborted).toBe(true);

    // a new fetch should have started
    await waitFor(() => screen.getByText('read: fetch #2'));
    expect(readSignal!.aborted).toBe(false);
});

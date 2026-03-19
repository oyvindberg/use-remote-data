import { Await, useRemoteData } from '../src';
import { AwaitUpdate } from '../src/AwaitUpdate';
import { useRemoteUpdate } from '../src/useRemoteUpdate';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

test('should start in initial state and render nothing', () => {
    const Test: React.FC = () => {
        const store = useRemoteUpdate(() => Promise.resolve('ok'));
        return (
            <div>
                <span>state: {store.current.type}</span>
                <AwaitUpdate store={store}>{(value) => <span>result: {value}</span>}</AwaitUpdate>
            </div>
        );
    };

    render(<Test />);
    expect(screen.getByText('state: initial')).toBeTruthy();
    expect(screen.queryByText(/result:/)).toBeNull();
});

test('should transition through pending to success', async () => {
    const Test: React.FC = () => {
        const store = useRemoteUpdate((n: string) => Promise.resolve(`saved ${n}`));
        return (
            <div>
                <button onClick={() => store.run('test')}>Run</button>
                <AwaitUpdate store={store}>{(value) => <span>{value}</span>}</AwaitUpdate>
            </div>
        );
    };

    render(<Test />);
    fireEvent.click(screen.getByText('Run'));
    await waitFor(() => screen.getByText('saved test'));
});

test('should handle failure and retry with same params', async () => {
    let shouldFail = true;
    const fetcher = (name: string): Promise<string> => {
        if (shouldFail) {
            shouldFail = false;
            return Promise.reject(new Error('boom'));
        }
        return Promise.resolve(`saved ${name}`);
    };

    const Test: React.FC = () => {
        const store = useRemoteUpdate(fetcher);
        return (
            <div>
                <button onClick={() => store.run('alice')}>Run</button>
                <AwaitUpdate store={store}>{(value) => <span>{value}</span>}</AwaitUpdate>
            </div>
        );
    };

    render(<Test />);
    fireEvent.click(screen.getByText('Run'));
    await waitFor(() => screen.getByText('Error: boom'));
    fireEvent.click(screen.getByText('retry'));
    await waitFor(() => screen.getByText('saved alice'));
});

test('should reset to initial state', async () => {
    const Test: React.FC = () => {
        const store = useRemoteUpdate(() => Promise.resolve('done'));
        return (
            <div>
                <button onClick={() => store.run()}>Run</button>
                <button onClick={() => store.reset()}>Reset</button>
                <span>state: {store.current.type}</span>
                <AwaitUpdate store={store}>{(value) => <span>{value}</span>}</AwaitUpdate>
            </div>
        );
    };

    render(<Test />);
    fireEvent.click(screen.getByText('Run'));
    await waitFor(() => screen.getByText('done'));
    fireEvent.click(screen.getByText('Reset'));
    await waitFor(() => screen.getByText('state: initial'));
    expect(screen.queryByText('done')).toBeNull();
});

test('should call invalidate on dependent stores after success', async () => {
    const invalidated: string[] = [];
    const fakeStore1 = { invalidate: () => invalidated.push('store1') };
    const fakeStore2 = { invalidate: () => invalidated.push('store2') };

    const Test: React.FC = () => {
        const store = useRemoteUpdate(() => Promise.resolve('ok'), {
            invalidates: [fakeStore1, fakeStore2],
        });
        return (
            <div>
                <button onClick={() => store.run()}>Run</button>
                <AwaitUpdate store={store}>{(value) => <span>{value}</span>}</AwaitUpdate>
            </div>
        );
    };

    render(<Test />);
    fireEvent.click(screen.getByText('Run'));
    await waitFor(() => screen.getByText('ok'));
    expect(invalidated).toEqual(['store1', 'store2']);
});

test('should call onSuccess callback after success', async () => {
    const calls: string[] = [];

    const Test: React.FC = () => {
        const store = useRemoteUpdate((name: string) => Promise.resolve(`saved ${name}`), {
            onSuccess: (value) => calls.push(value),
        });
        return (
            <div>
                <button onClick={() => store.run('bob')}>Run</button>
                <AwaitUpdate store={store}>{(value) => <span>{value}</span>}</AwaitUpdate>
            </div>
        );
    };

    render(<Test />);
    fireEvent.click(screen.getByText('Run'));
    await waitFor(() => screen.getByText('saved bob'));
    expect(calls).toEqual(['saved bob']);
});

test('should discard stale responses on rapid re-submission', async () => {
    let callCount = 0;
    const fetcher = (): Promise<string> => {
        callCount++;
        const myCount = callCount;
        return new Promise((resolve) => setTimeout(() => resolve(`result ${myCount}`), myCount === 1 ? 100 : 10));
    };

    const Test: React.FC = () => {
        const store = useRemoteUpdate(fetcher);
        return (
            <div>
                <button onClick={() => store.run()}>Run</button>
                <AwaitUpdate store={store}>{(value) => <span>{value}</span>}</AwaitUpdate>
            </div>
        );
    };

    render(<Test />);
    fireEvent.click(screen.getByText('Run'));
    fireEvent.click(screen.getByText('Run'));
    await waitFor(() => screen.getByText('result 2'));
    expect(screen.queryByText('result 1')).toBeNull();
});

test('should transition to invalidated-pending when re-running after success', async () => {
    let callCount = 0;

    const Test: React.FC = () => {
        const store = useRemoteUpdate(() => {
            callCount++;
            return new Promise<string>((resolve) => setTimeout(() => resolve(`result ${callCount}`), 50));
        });
        return (
            <div>
                <button onClick={() => store.run()}>Run</button>
                <span>state: {store.current.type}</span>
                <AwaitUpdate store={store}>{(value) => <span>value: {value}</span>}</AwaitUpdate>
            </div>
        );
    };

    render(<Test />);
    fireEvent.click(screen.getByText('Run'));
    await waitFor(() => screen.getByText('value: result 1'));
    fireEvent.click(screen.getByText('Run'));
    await waitFor(() => screen.getByText('state: invalidated-pending'));
    await waitFor(() => screen.getByText('value: result 2'));
});

test('should pass params to fetcher', async () => {
    const receivedParams: Array<{ a: number; b: string }> = [];
    const fetcher = (params: { a: number; b: string }): Promise<string> => {
        receivedParams.push(params);
        return Promise.resolve(`a=${params.a}, b=${params.b}`);
    };

    const Test: React.FC = () => {
        const store = useRemoteUpdate(fetcher);
        return (
            <div>
                <button onClick={() => store.run({ a: 1, b: 'hello' })}>Run</button>
                <AwaitUpdate store={store}>{(value) => <span>{value}</span>}</AwaitUpdate>
            </div>
        );
    };

    render(<Test />);
    fireEvent.click(screen.getByText('Run'));
    await waitFor(() => screen.getByText('a=1, b=hello'));
    expect(receivedParams).toEqual([{ a: 1, b: 'hello' }]);
});

test('should work with void params', async () => {
    const Test: React.FC = () => {
        const store = useRemoteUpdate(() => Promise.resolve('no params needed'));
        return (
            <div>
                <button onClick={() => store.run()}>Run</button>
                <AwaitUpdate store={store}>{(value) => <span>{value}</span>}</AwaitUpdate>
            </div>
        );
    };

    render(<Test />);
    fireEvent.click(screen.getByText('Run'));
    await waitFor(() => screen.getByText('no params needed'));
});

test('should render idle content in AwaitUpdate', async () => {
    const Test: React.FC = () => {
        const store = useRemoteUpdate(() => Promise.resolve('done'));
        return (
            <AwaitUpdate store={store} idle={(run) => <button onClick={() => run()}>Start</button>}>
                {(value) => <span>{value}</span>}
            </AwaitUpdate>
        );
    };

    render(<Test />);
    expect(screen.getByText('Start')).toBeTruthy();
    fireEvent.click(screen.getByText('Start'));
    await waitFor(() => screen.getByText('done'));
});

test('should not update state after unmount', async () => {
    let resolve: (value: string) => void;
    const fetcher = (): Promise<string> =>
        new Promise((r) => {
            resolve = r;
        });

    const Test: React.FC = () => {
        const store = useRemoteUpdate(fetcher);
        return (
            <div>
                <button onClick={() => store.run()}>Run</button>
                <span>state: {store.current.type}</span>
            </div>
        );
    };

    const rendered = render(<Test />);
    fireEvent.click(screen.getByText('Run'));
    await waitFor(() => screen.getByText('state: pending'));
    rendered.unmount();
    // resolve after unmount — should not throw
    resolve!('late result');
    // give the microtask a chance to settle
    await new Promise((r) => setTimeout(r, 10));
});

test('should invalidate read stores after mutation success', async () => {
    let fetchCount = 0;
    const fetchData = (): Promise<string> => {
        fetchCount++;
        return Promise.resolve(`fetch #${fetchCount}`);
    };

    const Test: React.FC = () => {
        const readStore = useRemoteData(fetchData);
        const mutateStore = useRemoteUpdate(() => Promise.resolve('mutated'), {
            invalidates: [readStore],
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
    fireEvent.click(screen.getByText('Mutate'));
    await waitFor(() => screen.getByText('write: mutated'));
    await waitFor(() => screen.getByText('read: fetch #2'));
});

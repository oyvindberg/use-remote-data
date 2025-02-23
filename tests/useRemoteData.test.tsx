import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RemoteDataStore, useRemoteData, WithRemoteData, InvalidationStrategy } from '../src';

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
        return <WithRemoteData store={store}>{(num) => <span>num: {num}</span>}</WithRemoteData>;
    };

    render(<Test />);

    await waitFor(() => screen.getByText('num: 1'));
});

test('should handle failure to create promise', async () => {
    const Test: React.FC = () => {
        const store = useRemoteData<number>(() => {
            throw new Error('foo');
        });
        return <WithRemoteData store={store}>{(num) => <span>num: {num}</span>}</WithRemoteData>;
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
            <WithRemoteData store={store}>
                {([num1, num2]) => (
                    <span>
                        nums: {num1} and {num2}
                    </span>
                )}
            </WithRemoteData>
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
        return <WithRemoteData store={store}>{(char) => <span>char: {char}</span>}</WithRemoteData>;
    };

    render(<Test />);
    await waitFor(() => screen.getByText('Error: foo'));
    const button = await waitFor(() => screen.getByRole('button'));
    fireEvent.click(button);
    await waitFor(() => screen.getByText('char: a'));
});

test('invalidation: refetchAfterMillis should work', async () => {
    const testPromise = new TestPromise();
    const Test: React.FC = () => {
        const store = useRemoteData(testPromise.next, { invalidation: InvalidationStrategy.refetchAfterMillis(10) });
        return (
            <WithRemoteData store={store}>
                {(num, isInvalidated) => (
                    <span>
                        num: {num}, isInvalidated: {isInvalidated.toString()}
                    </span>
                )}
            </WithRemoteData>
        );
    };
    render(<Test />);

    await waitFor(() => screen.getByText('...'));
    await waitFor(() => screen.getByText('num: 1, isInvalidated: false'));
    await waitFor(() => screen.getByText('num: 1, isInvalidated: true'));
    await waitFor(() => screen.getByText('num: 2, isInvalidated: false'));
});

test('invalidation: polling should work', async () => {
    const testPromise = new TestPromise();
    const Test: React.FC = () => {
        const store = useRemoteData(testPromise.next, {
            invalidation: InvalidationStrategy.pollUntil((x) => x >= 2, 10),
        });
        return (
            <WithRemoteData store={store}>
                {(num, isInvalidated) => (
                    <span>
                        num: {num}, isInvalidated: {isInvalidated.toString()}
                    </span>
                )}
            </WithRemoteData>
        );
    };
    render(<Test />);

    await waitFor(() => screen.getByText('...'));
    await waitFor(() => screen.getByText('num: 1, isInvalidated: true'));
    await waitFor(() => screen.getByText('num: 2, isInvalidated: false'));
});

test('invalidation: polling should stop on unmount', async () => {
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
            invalidation: InvalidationStrategy.pollUntil(() => false, 10),
            debug: (str) => messages.push(str),
        });
        return (
            <WithRemoteData store={store}>
                {(num, isInvalidated) => (
                    <span>
                        num: {num}, isInvalidated: {isInvalidated.toString()}
                    </span>
                )}
            </WithRemoteData>
        );
    };
    const rendered = render(<Test />);

    await waitFor(() => screen.getByText('...'));
    await waitFor(() => screen.getByText('num: 1, isInvalidated: true'));
    rendered.unmount();
    if (testPromise.i == 2) throw 'polling did not stop';
    expect(messages).toContain(`undefined: cancelled invalidation on unmount`);
});

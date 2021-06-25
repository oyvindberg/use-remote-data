import '@testing-library/jest-dom/extend-expect';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RemoteDataStore, useRemoteData, WithRemoteData } from '../src';

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

test('invalidation should work', async () => {
    const testPromise = new TestPromise();
    const Test: React.FC = () => {
        const store = useRemoteData(testPromise.next, { ttlMillis: 10 });
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

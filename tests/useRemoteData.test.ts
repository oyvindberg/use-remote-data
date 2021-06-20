import { act, renderHook } from '@testing-library/react-hooks/dom';
import { RemoteData, useRemoteData } from '../src';

class TestPromise {
    i = 0;
    next = (): Promise<number> => {
        this.i += 1;
        return Promise.resolve(this.i);
    };
}

test('should handle success', async () => {
    const testPromise = new TestPromise();

    const tester = renderHook(() => useRemoteData(testPromise.next));

    await act(async () => {
        await tester.result.current.triggerUpdate();
    });

    expect(tester.result.current.current).toStrictEqual(RemoteData.Yes(1));
});

test('should handle successes', async () => {
    const testPromise = new TestPromise();

    const tester = renderHook(() => useRemoteData(testPromise.next));

    await act(async () => {
        await tester.result.current.triggerUpdate();
    });

    expect(tester.result.current.current).toStrictEqual(RemoteData.Yes(1));
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

    const tester = renderHook(() => useRemoteData(testPromise));

    await act(async () => {
        await tester.result.current.triggerUpdate();
    });

    expect(tester.result.current.current.type).toStrictEqual('no');
    const no = tester.result.current.current as RemoteData.No;
    expect(no.error).toStrictEqual(error);

    await act(no.retry);

    expect(tester.result.current.current).toStrictEqual(RemoteData.Yes('a'));
});

test('invalidation should work', async () => {
    jest.useFakeTimers();

    const testPromise = new TestPromise();

    const ttlMillis = 10;
    const tester = renderHook(() => useRemoteData(testPromise.next, { ttlMillis }));
    await act(async () => {
        await tester.result.current.triggerUpdate();
    });

    expect(tester.result.current.current).toStrictEqual(RemoteData.Yes(1));

    await act(async () => {
        jest.advanceTimersByTime(ttlMillis);
    });
    await act(async () => {
        await tester.result.current.triggerUpdate();
    });
    expect(tester.result.current.current).toStrictEqual(RemoteData.Yes(2));

    jest.useRealTimers();
});

import { act, renderHook, RenderResult } from '@testing-library/react-hooks/dom';
import { RemoteData, useRemoteData } from '../src';
import { RemoteDataStore } from '../src';
import { isDefined } from '../src/internal/isDefined';

class TestPromise {
    i = 0;
    next = (): Promise<number> => {
        this.i += 1;
        return Promise.resolve(this.i);
    };
}

const drop = <T>(t: T): void => {};

const triggerAndWait = <T>(result: RenderResult<RemoteDataStore<T>>) => (): Promise<void> => {
        const triggered = result.current.triggerUpdate();
        if (isDefined(triggered.promise)) {
            return triggered.promise;
        }
        return new Promise((ok) => ok());
    };

test('should handle success', async () => {
    const testPromise = new TestPromise();
    const rendered = renderHook(() => useRemoteData(testPromise.next));
    await act(triggerAndWait(rendered.result))

    expect(rendered.result.current.current).toStrictEqual(RemoteData.Yes(1));
});

test('should handle successes', async () => {
    const testPromise = new TestPromise();
    const rendered = renderHook(() => useRemoteData(testPromise.next));
    await act(triggerAndWait(rendered.result))

    expect(rendered.result.current.current).toStrictEqual(RemoteData.Yes(1));
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

    const rendered = renderHook(() => useRemoteData(testPromise));

    await act(triggerAndWait(rendered.result))

    expect(rendered.result.current.current.type).toStrictEqual('no');
    const no = rendered.result.current.current as RemoteData.No;
    expect(no.errors).toStrictEqual([error]);

    await act(no.retry);

    expect(rendered.result.current.current).toStrictEqual(RemoteData.Yes('a'));
});

test('invalidation should work', async () => {
    jest.useFakeTimers();

    const testPromise = new TestPromise();

    const rendered = renderHook(() => useRemoteData(testPromise.next, { ttlMillis: 10 }));
    await act(triggerAndWait(rendered.result));

    expect(rendered.result.current.current).toStrictEqual(RemoteData.Yes(1));

    await act(triggerAndWait(rendered.result));
    await act(() => drop(jest.runOnlyPendingTimers()));
    await act(triggerAndWait(rendered.result));
    expect(rendered.result.current.current).toStrictEqual(RemoteData.Yes(2));

    jest.useRealTimers();
});

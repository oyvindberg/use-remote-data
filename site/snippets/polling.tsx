import { RefreshStrategy, useRemoteData, Await } from 'use-remote-data';

let i = 0;
const freshData = (): Promise<number> =>
    new Promise((resolve) => {
        i += 1;
        setTimeout(() => resolve(i), 1000);
    });

export function Component() {
    const store = useRemoteData(freshData, {
        refresh: RefreshStrategy.pollUntil((x) => x > 2, 1000),
        storeName: 'polling-store',
    });

    return (
        <Await store={store}>
            {(num, isStale) =>
                isStale ? <span>stale data {num}</span> : <span>{num}</span>
            }
        </Await>
    );
}

import {
    RefreshStrategy,
    RemoteDataStore,
    useRemoteData,
    Await,
} from 'use-remote-data';

let i = 0;
const freshData = (): Promise<number> =>
    new Promise((resolve) => {
        i += 1;
        setTimeout(() => resolve(i), 1000);
    });

export function Component() {
    const store = useRemoteData(freshData, {
        refresh: RefreshStrategy.afterMillis(2000),
    });

    return (
        <div>
            <Child store={store} />
            <Child store={store} />
        </div>
    );
}

export function Child({ store }: { store: RemoteDataStore<number> }) {
    return (
        <Await store={store}>
            {(num, isStale) => (
                <p>
                    <span style={{ color: isStale ? 'darkgray' : 'black' }}>
                        {num}
                    </span>
                </p>
            )}
        </Await>
    );
}

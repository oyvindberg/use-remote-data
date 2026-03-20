import { RemoteDataStore, useRemoteData, Await } from 'use-remote-data';

function produce<T>(value: T, delay: number): Promise<T> {
    return new Promise((resolve) => setTimeout(() => resolve(value), delay));
}

export function Component() {
    const computeOne = useRemoteData(() => produce(1, 1000));
    const computeString = useRemoteData(() => produce('Hello', 1000));

    const combinedStore = RemoteDataStore.all(computeOne, computeString);

    return (
        <Await store={combinedStore}>
            {([num, string]) => (
                <span>
                    {num} and {string}
                </span>
            )}
        </Await>
    );
}

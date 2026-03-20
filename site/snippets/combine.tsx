import { RemoteDataStore, useRemoteData, Await } from 'use-remote-data';

function produce<T>(value: T, delay: number = 1000): Promise<T> {
    return new Promise((resolve) => setTimeout(() => resolve(value), delay));
}

export function Component() {
    const computeOne = useRemoteData(() => produce(1));
    const computeString = useRemoteData(() => produce('Hello'));

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

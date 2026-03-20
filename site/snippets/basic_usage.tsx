import { useRemoteData, Await } from 'use-remote-data';

// all examples will use a fake API like this
function produce<T>(value: T, delayMillis: number): Promise<T> {
    return new Promise((resolve) =>
        setTimeout(() => resolve(value), delayMillis)
    );
}

export function Component() {
    // create a store, which will produce data after a second
    const computeOne = useRemoteData(() => produce(1, 1000));

    // fetch and render
    return (
        <Await store={computeOne}>{(num) => <span>{num}</span>}</Await>
    );
}

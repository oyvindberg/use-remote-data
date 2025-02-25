import * as React from 'react';
import {
    RemoteDataStore,
    useRemoteData,
    WithRemoteData,
} from 'use-remote-data';

// all examples will use a fake API like this
function produce<T>(value: T, delayMillis: number): Promise<T> {
    return new Promise((resolve) =>
        setTimeout(() => resolve(value), delayMillis)
    );
}

export const Component: React.FC = () => {
    // create a store, which will produce data after a second
    const computeOne: RemoteDataStore<number> = //
        useRemoteData(() => produce(1, 1000));

    // fetch and render
    return (
        <WithRemoteData store={computeOne}>
            {(num: number) => <span>{num}</span>}
        </WithRemoteData>
    );
};

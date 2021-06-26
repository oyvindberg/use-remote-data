import * as React from 'react';
import { RemoteDataStore, useRemoteData, WithRemoteData } from 'use-remote-data';

// we'll use this example throughout. obviously you would typically call an API
function produce<T>(value: T, delay: number = 1000): Promise<T> {
    return new Promise((resolve) => setTimeout(() => resolve(value), delay));
}

//START
export const Component: React.FC = () => {
    const computeOne = useRemoteData(() => produce(1));
    const computeString = useRemoteData(() => produce('Hello'));

    const combinedStore =
      RemoteDataStore.all(computeOne, computeString);

    return <WithRemoteData store={combinedStore}>
            {([num, string]) => <span>{num} and {string}</span>}
        </WithRemoteData>;
};

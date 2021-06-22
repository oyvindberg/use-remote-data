import * as React from 'react';
import { RemoteDataStore, useRemoteData, WithRemoteData } from 'use-remote-data';

//START
var i = 0;
const freshData = (): Promise<number> =>
    new Promise((resolve) => {
        i += 1;
        setTimeout(() => resolve(i), 1000);
    });

export const Component: React.FC = () => {
    const store = useRemoteData(freshData, { ttlMillis: 2000 });

    return (
        <WithRemoteData store={store}>
            {(num, isInvalidated) =>
              <span style={{ color: isInvalidated ? 'darkgray' : 'black' }}>{num}</span>
            }
        </WithRemoteData>
    );
};

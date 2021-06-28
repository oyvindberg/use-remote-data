import * as React from 'react';
import { RemoteDataStore, useRemoteData, WithRemoteData } from 'use-remote-data';

var i = 0;
const freshData = (): Promise<number> =>
    new Promise((resolve) => {
        i += 1;
        setTimeout(() => resolve(i), 1000);
    });

export const Component: React.FC = () => {
    const store = useRemoteData(freshData, { ttlMillis: 2000 });

    return (
        <div>
            <Child store={store} />
            <Child store={store} />
        </div>
    );
};

export const Child: React.FC<{ store: RemoteDataStore<number> }> = ({ store }) => (
    <WithRemoteData store={store}>
        {(num, isInvalidated) =>
          <p><span style={{ color: isInvalidated ? 'darkgray' : 'black' }}>{num}</span></p>
        }
    </WithRemoteData>
);

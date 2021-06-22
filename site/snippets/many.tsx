import * as React from 'react';
import { RemoteDataStore, useRemoteData, WithRemoteData } from 'use-remote-data';

let i = 0;
const freshData = (): Promise<number> =>
    new Promise((resolve) => {
        const j = i += 1;
        setTimeout(() => resolve(j), 1000);
    });

//START
export const Component: React.FC = () => {
    const stores: RemoteDataStore<number>[] = [];
    for (let j = 0; j < 20; j++) {
      stores.push(useRemoteData(freshData, { ttlMillis: 500 * j }))
    }
    return (
        <div style={{display: 'flex', justifyContent: 'space-around'}}>
            <Child stores={stores} />
            <Child stores={stores} />
        </div>
    );
};

export const Child: React.FC<{ stores: ReadonlyArray<RemoteDataStore<number>> }> = ({ stores }) => {
    const rendered = stores.map((store, idx) => (
        <WithRemoteData store={store} key={idx}>
            {(num, isInvalidated) => <p><span style={{ color: isInvalidated ? 'darkgray' : 'black' }}>{num}</span></p>}
        </WithRemoteData>
    ));
    return <div>{rendered}</div>;
};

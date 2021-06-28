import * as React from 'react';
import { RemoteDataStore, RemoteDataStores, useRemoteDatas, WithRemoteData } from 'use-remote-data';

let is = new Map<string, number>();

const freshData = (key: string): Promise<string> =>
    new Promise((resolve) => {
        const num = is.get(key) || 0;
        is.set(key, num + 1);
        setTimeout(() => resolve(`${key}: ${num}`), 500);
    });

export const Component: React.FC = () => {
    // provide `freshData` function
    const stores: RemoteDataStores<string, string> = useRemoteDatas(freshData, { ttlMillis: 1000 });

  const [wanted, setWanted] = React.useState('a, b,d');

    const parsedWanted: readonly string[] =
      wanted
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

    const currentStores: readonly RemoteDataStore<string>[] =
      stores.getMany(parsedWanted);

    return (
        <div>
            Add/remove stores by editing the text, it's split by comma.
            <input value={wanted} onChange={(e) => setWanted(e.currentTarget.value)} />
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <Column rows={currentStores} />
              <Column rows={currentStores} />
            </div>
        </div>
    );
};

export const Column: React.FC<{ rows: readonly RemoteDataStore<string>[] }> = ({ rows }) => {
    const renderedRows = rows.map((store, idx) => (
        <WithRemoteData store={store} key={idx}>
            {(value, isInvalidated) => <p><span style={{ color: isInvalidated ? 'darkgray' : 'black' }}>{value}</span></p>}
        </WithRemoteData>
    ));
    return <div>{renderedRows}</div>;
};

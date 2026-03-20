import { useState } from 'react';
import {
    InvalidationStrategy,
    RemoteDataStore,
    RemoteDataMap,
    useRemoteDataMap,
    Await,
} from 'use-remote-data';

const is = new Map<string, number>();

const freshData = (key: string): Promise<string> =>
    new Promise((resolve) => {
        const num = is.get(key) || 0;
        is.set(key, num + 1);
        setTimeout(() => resolve(`${key}: ${num}`), 500);
    });

export function Component() {
    // provide `freshData` function
    const stores: RemoteDataMap<string, string> = useRemoteDataMap(freshData, {
        invalidation: InvalidationStrategy.refetchAfterMillis(1000),
    });

    const [wanted, setWanted] = useState('a, b,d');

    const parsedWanted: readonly string[] = wanted
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

    const currentStores: readonly RemoteDataStore<string>[] =
        stores.getMany(parsedWanted);

    return (
        <div>
            Add/remove stores by editing the text, it's split by comma.
            <input
                value={wanted}
                onChange={(e) => setWanted(e.currentTarget.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                <Column rows={currentStores} />
                <Column rows={currentStores} />
            </div>
        </div>
    );
}

export function Column({ rows }: { rows: readonly RemoteDataStore<string>[] }) {
    const renderedRows = rows.map((store, idx) => (
        <Await store={store} key={idx}>
            {(value, isInvalidated) => (
                <p>
                    <span
                        style={{ color: isInvalidated ? 'darkgray' : 'black' }}
                    >
                        {value}
                    </span>
                </p>
            )}
        </Await>
    ));
    return <div>{renderedRows}</div>;
}

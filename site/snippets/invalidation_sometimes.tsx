import { useState } from 'react';
import { RefreshStrategy, useRemoteData, Await } from 'use-remote-data';

let i = 0;
const freshData = (): Promise<number> =>
    new Promise((resolve) => {
        i += 1;
        setTimeout(() => resolve(i), 1000);
    });

export function Component() {
    const [autoRefresh, setAutoRefresh] = useState(true);
    const store = useRemoteData(freshData, {
        refresh: autoRefresh ? RefreshStrategy.afterMillis(1000) : undefined,
    });

    return (
        <div>
            <label>
                Autorefresh:
                <input
                    type="checkbox"
                    onChange={(e) => setAutoRefresh(!autoRefresh)}
                    checked={autoRefresh}
                />
            </label>
            <br />
            <Await store={store}>
                {(num, isStale) => (
                    <span style={{ color: isStale ? 'darkgray' : 'black' }}>
                        {num}
                    </span>
                )}
            </Await>
        </div>
    );
}

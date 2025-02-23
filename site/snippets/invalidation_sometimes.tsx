import * as React from 'react';
import { InvalidationStrategy, useRemoteData, WithRemoteData } from 'use-remote-data';

var i = 0;
const freshData = (): Promise<number> =>
    new Promise((resolve) => {
        i += 1;
        setTimeout(() => resolve(i), 1000);
    });

export const Component: React.FC = () => {
    const [autoRefresh, setAutoRefresh] = React.useState(true);
    const store = useRemoteData(
        freshData,
        { invalidation: autoRefresh ? InvalidationStrategy.refetchAfterMillis(1000) : undefined },
    );

    return (
        <div>
            <label>
                Autorefresh:
                <input type="checkbox" onChange={(e) => setAutoRefresh(!autoRefresh)} checked={autoRefresh} />
            </label>
            <br />
            <WithRemoteData store={store}>
                {(num, isInvalidated) => <span style={{ color: isInvalidated ? 'darkgray' : 'black' }}>{num}</span>}
            </WithRemoteData>
        </div>
    );
};

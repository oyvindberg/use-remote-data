import * as React from 'react';
import {
    InvalidationStrategy,
    useRemoteData,
    WithRemoteData,
} from 'use-remote-data';

var i = 0;
const freshData = (): Promise<number> =>
    new Promise((resolve) => {
        i += 1;
        setTimeout(() => resolve(i), 1000);
    });

export const Component: React.FC = () => {
    const store = useRemoteData(freshData, {
        invalidation: InvalidationStrategy.pollUntil((x) => x > 2, 10000),
        debug: true,
        storeName: 'polling-store',
    });

    return (
        <WithRemoteData store={store}>
            {(num, notValid) =>
                notValid ? <span>invalid data {num}</span> : <span>{num}</span>
            }
        </WithRemoteData>
    );
};

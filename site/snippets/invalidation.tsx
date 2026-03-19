import * as React from 'react';
import { InvalidationStrategy, useRemoteData, Await } from 'use-remote-data';

var i = 0;
const freshData = (): Promise<number> =>
    new Promise((resolve) => {
        i += 1;
        setTimeout(() => resolve(i), 1000);
    });

export const Component: React.FC = () => {
    const store = useRemoteData(freshData, {
        invalidation: InvalidationStrategy.refetchAfterMillis(2000),
    });

    return (
        <Await store={store}>
            {(num, isInvalidated) => (
                <span style={{ color: isInvalidated ? 'darkgray' : 'black' }}>
                    {num}
                </span>
            )}
        </Await>
    );
};

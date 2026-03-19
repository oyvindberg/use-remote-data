import * as React from 'react';
import {
    useRemoteData,
    useRemoteUpdate,
    WithRemoteData,
    WithRemoteUpdate,
} from 'use-remote-data';

var counter = 0;
const fetchCount = (): Promise<number> =>
    new Promise((resolve) => setTimeout(() => resolve(counter), 500));

const increment = (): Promise<string> =>
    new Promise((resolve) => {
        counter++;
        setTimeout(() => resolve(`incremented to ${counter}`), 500);
    });

export const Component: React.FC = () => {
    const countStore = useRemoteData(fetchCount);
    const incrementStore = useRemoteUpdate(() => increment(), {
        invalidates: [countStore],
    });

    return (
        <div>
            <WithRemoteData store={countStore}>
                {(count, isInvalidated) => (
                    <span style={{ color: isInvalidated ? 'gray' : 'black' }}>
                        Count: {count}
                    </span>
                )}
            </WithRemoteData>{' '}
            <button
                onClick={() => incrementStore.run()}
                disabled={incrementStore.current.type === 'pending'}
            >
                Increment
            </button>
            <WithRemoteUpdate store={incrementStore}>
                {(msg) => <p>✓ {msg}</p>}
            </WithRemoteUpdate>
        </div>
    );
};

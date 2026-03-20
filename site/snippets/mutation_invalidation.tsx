import {
    useRemoteData,
    useRemoteUpdate,
    Await,
    AwaitUpdate,
} from 'use-remote-data';

let counter = 0;
const fetchCount = (): Promise<number> =>
    new Promise((resolve) => setTimeout(() => resolve(counter), 500));

const increment = (): Promise<string> =>
    new Promise((resolve) => {
        counter++;
        setTimeout(() => resolve(`incremented to ${counter}`), 500);
    });

export function Component() {
    const countStore = useRemoteData(fetchCount);
    const incrementStore = useRemoteUpdate(() => increment(), {
        invalidates: [countStore],
    });

    return (
        <div>
            <Await store={countStore}>
                {(count, isInvalidated) => (
                    <span style={{ color: isInvalidated ? 'gray' : 'black' }}>
                        Count: {count}
                    </span>
                )}
            </Await>{' '}
            <button
                onClick={() => incrementStore.run()}
                disabled={incrementStore.current.type === 'pending'}
            >
                Increment
            </button>
            <AwaitUpdate store={incrementStore}>
                {(msg) => <p>✓ {msg}</p>}
            </AwaitUpdate>
        </div>
    );
}

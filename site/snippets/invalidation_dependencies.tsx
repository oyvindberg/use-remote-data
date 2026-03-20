import { useState } from 'react';
import { useRemoteData, Await } from 'use-remote-data';

let i = 0;
const freshData = (): Promise<number> =>
    new Promise((resolve) => {
        i += 1;
        setTimeout(() => resolve(i), 1000);
    });

export function Component() {
    const [dep, setDep] = useState(1);
    const store = useRemoteData(freshData, { dependencies: [dep] });

    return (
        <div>
            <button onClick={() => setDep(dep + 1)}>Bump dep</button>
            <br />
            <Await store={store}>
                {(num, isInvalidated) => (
                    <span
                        style={{ color: isInvalidated ? 'darkgray' : 'black' }}
                    >
                        {num}
                    </span>
                )}
            </Await>
        </div>
    );
}

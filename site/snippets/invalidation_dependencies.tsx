import * as React from 'react';
import { useRemoteData, WithRemoteData } from 'use-remote-data';

var i = 0;
const freshData = (): Promise<number> =>
    new Promise((resolve) => {
        i += 1;
        setTimeout(() => resolve(i), 1000);
    });

export const Component: React.FC = () => {
    const [dep, setDep] = React.useState(1);
    const store = useRemoteData(freshData, { dependencies: [dep] });

    return (
        <div>
            <button onClick={() => setDep(dep + 1)}>Bump dep</button>
            <br />
            <WithRemoteData store={store}>
                {(num, isInvalidated) => <span style={{ color: isInvalidated ? 'darkgray' : 'black' }}>{num}</span>}
            </WithRemoteData>
        </div>
    );
};

import * as React from 'react';
import { useRemoteUpdate, WithRemoteUpdate } from 'use-remote-data';

var attempts = 0;
const riskyOperation = (): Promise<string> =>
    new Promise((resolve, reject) => {
        attempts++;
        setTimeout(() => {
            if (attempts % 3 === 0) reject(new Error('server error (every 3rd attempt fails)'));
            else resolve(`success on attempt #${attempts}`);
        }, 800);
    });

export const Component: React.FC = () => {
    const store = useRemoteUpdate(() => riskyOperation());

    return (
        <div>
            <WithRemoteUpdate
                store={store}
                idle={(run) => <button onClick={() => run()}>Start operation</button>}
            >
                {(result, run, reset) => (
                    <div>
                        <p>Result: {result}</p>
                        <button onClick={() => run()}>Run again</button>{' '}
                        <button onClick={() => reset()}>Reset</button>
                    </div>
                )}
            </WithRemoteUpdate>
        </div>
    );
};

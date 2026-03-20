import { useRemoteUpdate, AwaitUpdate } from 'use-remote-data';

let attempts = 0;
const riskyOperation = (): Promise<string> =>
    new Promise((resolve, reject) => {
        attempts++;
        setTimeout(() => {
            if (attempts % 3 === 0)
                reject(new Error('server error (every 3rd attempt fails)'));
            else resolve(`success on attempt #${attempts}`);
        }, 800);
    });

export function Component() {
    const store = useRemoteUpdate(() => riskyOperation());

    return (
        <div>
            <AwaitUpdate
                store={store}
                idle={(run) => (
                    <button onClick={() => run()}>Start operation</button>
                )}
            >
                {(result, run, reset) => (
                    <div>
                        <p>Result: {result}</p>
                        <button onClick={() => run()}>Run again</button>{' '}
                        <button onClick={() => reset()}>Reset</button>
                    </div>
                )}
            </AwaitUpdate>
        </div>
    );
}

import { useState } from 'react';
import { useRemoteUpdate, AwaitUpdate } from 'use-remote-data';

const saveItem = (name: string): Promise<string> =>
    new Promise((resolve) =>
        setTimeout(
            () =>
                resolve(
                    `saved "${name}" with id #${Math.floor(Math.random() * 1000)}`
                ),
            800
        )
    );

export function Component() {
    const [name, setName] = useState('');
    const store = useRemoteUpdate((n: string) => saveItem(n), {
        storeName: 'Save item',
    });

    return (
        <div>
            <label>
                name:{' '}
                <input
                    value={name}
                    onChange={(e) => setName(e.currentTarget.value)}
                />
            </label>{' '}
            <button
                onClick={() => store.run(name)}
                disabled={!name || store.current.type === 'pending'}
            >
                Save
            </button>
            <AwaitUpdate store={store}>{(msg) => <p>✓ {msg}</p>}</AwaitUpdate>
        </div>
    );
}

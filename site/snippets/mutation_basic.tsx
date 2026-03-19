import * as React from 'react';
import { useRemoteUpdate, WithRemoteUpdate } from 'use-remote-data';

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

export const Component: React.FC = () => {
    const [name, setName] = React.useState('');
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
            <WithRemoteUpdate store={store}>
                {(msg) => <p>✓ {msg}</p>}
            </WithRemoteUpdate>
        </div>
    );
};

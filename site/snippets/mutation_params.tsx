import * as React from 'react';
import { useRemoteUpdate, AwaitUpdate } from 'use-remote-data';

type UserParams = { firstName: string; lastName: string };

const createUser = (params: UserParams): Promise<string> =>
    new Promise((resolve) =>
        setTimeout(
            () => resolve(`Created ${params.firstName} ${params.lastName}`),
            800
        )
    );

export const Component: React.FC = () => {
    const [firstName, setFirstName] = React.useState('');
    const [lastName, setLastName] = React.useState('');
    const store = useRemoteUpdate((p: UserParams) => createUser(p));

    return (
        <div>
            <input
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.currentTarget.value)}
            />{' '}
            <input
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.currentTarget.value)}
            />{' '}
            <button
                onClick={() => store.run({ firstName, lastName })}
                disabled={
                    !firstName || !lastName || store.current.type === 'pending'
                }
            >
                Create
            </button>
            <AwaitUpdate store={store}>
                {(msg, run, reset) => (
                    <div>
                        <p>{msg}</p>
                        <button onClick={() => run({ firstName, lastName })}>
                            Create another
                        </button>{' '}
                        <button onClick={() => reset()}>Clear</button>
                    </div>
                )}
            </AwaitUpdate>
        </div>
    );
};

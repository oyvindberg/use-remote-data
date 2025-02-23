import * as React from 'react';
import { useRemoteData, WithRemoteData } from 'use-remote-data';

const createUser = (name: string): Promise<string> =>
    new Promise((resolve) => {
        setTimeout(() => resolve(`created user with name ${name} and id #1`), 1000);
    });

export const Component: React.FC = () => {
    const [name, setName] = React.useState('');
    const [submit, setSubmit] = React.useState(false);
    const createUserStore = useRemoteData(() => createUser(name));

    return (
        <div>
            <h4>Create user</h4>
            <label>
                name:
                <input onChange={(e) => setName(e.currentTarget.value)} value={name} />
            </label>
            <button onClick={() => setSubmit(true)}>Create user</button>
            {submit && <WithRemoteData store={createUserStore}>{(msg) => <p>{msg}</p>}</WithRemoteData>}
        </div>
    );
};
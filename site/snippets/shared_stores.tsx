import { Await } from 'use-remote-data';
import { SharedStoreProvider, useSharedRemoteData } from 'use-remote-data';

let fetchCount = 0;

function fetchUser(): Promise<{ name: string; fetchNumber: number }> {
    fetchCount++;
    const n = fetchCount;
    return new Promise((resolve) =>
        setTimeout(() => resolve({ name: 'Alice', fetchNumber: n }), 800)
    );
}

function UserBadge() {
    const store = useSharedRemoteData('currentUser', fetchUser);
    return (
        <Await store={store}>
            {(user) => (
                <div>
                    Badge: <strong>{user.name}</strong> (fetch #{user.fetchNumber})
                </div>
            )}
        </Await>
    );
}

function UserGreeting() {
    const store = useSharedRemoteData('currentUser', fetchUser);
    return (
        <Await store={store}>
            {(user) => (
                <div>
                    Hello, <strong>{user.name}</strong>! (fetch #{user.fetchNumber})
                </div>
            )}
        </Await>
    );
}

export function Component() {
    return (
        <SharedStoreProvider>
            <UserBadge />
            <UserGreeting />
            <p style={{ fontSize: '0.85em', color: 'gray' }}>
                Both components show the same fetch number — one fetch, shared state.
            </p>
        </SharedStoreProvider>
    );
}

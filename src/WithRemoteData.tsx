import { useEffect } from 'react';
import { RemoteData } from './RemoteData';
import { RemoteDataStore } from './RemoteDataStore';

interface Props<T> {
    store: RemoteDataStore<T>;
    children: (value: T, isInvalidated: boolean) => JSX.Element;
}

export function WithRemoteData<T>({ store, children }: Props<T>): JSX.Element {
    // This triggers updating the data in the store when needed.
    // Apparently it needs to be within `useEffect` because it updates a state hook in a parent component
    useEffect(store.triggerUpdate as (() => void), [store]);

    return RemoteData.fold(store.current)(
        children,
        () => <div>...</div>,
        (err, retry) => {
            const title = store.storeName ? (
                <strong>Failed request for store {store.storeName}</strong>
            ) : (
                <strong>Failed request</strong>
            );

            if (err instanceof Error) {
                return (
                    <div>
                        {title}
                        <span>
                            {err.name}: {err.message}
                        </span>
                        <pre>
                            <code>{err.stack}</code>
                        </pre>
                        <button onClick={retry}>retry</button>
                    </div>
                );
            }
            return (
                <div>
                    {title}
                    <pre>
                        <code>{JSON.stringify(err)}</code>
                    </pre>
                    <button onClick={retry}>retry</button>
                </div>
            );
        }
    );
}

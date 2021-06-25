import { useEffect } from 'react';
import { RemoteData } from './RemoteData';
import { RemoteDataStore } from './RemoteDataStore';

interface Props<T> {
    store: RemoteDataStore<T>;
    children: (value: T, isInvalidated: boolean) => JSX.Element;
}

/**
 * This component provides convenient syntax to write code which only handles data which is present.
 *
 * It's expected that you copy/paste the component into your own code base and customize
 * rendering of spinners, errors messages and so on.
 */
export function WithRemoteData<T>({ store, children }: Props<T>): JSX.Element {
    // This triggers updating the data in the store when needed.
    // Apparently it needs to be within `useEffect` because it updates a state hook in a parent component
    // If you copy/paste this component you should keep this line as is
    useEffect(store.triggerUpdate as () => void, [store]);

    return RemoteData.fold(store.current)(
        children,
        () => <div>...</div>,
        (errors, retry) => {
            const title = store.storeName ? (
                <strong>Failed request for store {store.storeName}</strong>
            ) : (
                <strong>Failed request</strong>
            );

            const renderedErrors = errors.map((error, idx) => {
                if (error instanceof Error) {
                    return (
                        <div key={idx}>
                            <span>
                                {error.name}: {error.message}
                            </span>
                            <pre>
                                <code>{error.stack}</code>
                            </pre>
                        </div>
                    );
                }
                return (
                    <div key={idx}>
                        <pre>
                            <code>{JSON.stringify(error)}</code>
                        </pre>
                    </div>
                );
            });

            return (
                <div>
                    {title}
                    {renderedErrors}
                    <button onClick={retry}>retry</button>
                </div>
            );
        }
    );
}

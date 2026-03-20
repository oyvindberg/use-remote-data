import { DefaultErrorComponent, ErrorProps } from './DefaultErrorComponent';
import { DefaultPendingComponent } from './DefaultPendingComponent';
import { RemoteData } from './RemoteData';
import { RemoteDataStore } from './RemoteDataStore';
import { ReactElement, ReactNode, useEffect } from 'react';

interface Props<T, E> {
    store: RemoteDataStore<T, E>;
    children: (value: T, isStale: boolean) => ReactNode;
    loading?: () => ReactNode;
    error?: (props: ErrorProps<E>) => ReactNode;
}

/**
 * This component provides convenient syntax to write code which only handles data which is present.
 *
 * It's expected that you create a local replacement for this component. Either copy/paste this,
 *  or wrap it with your own rendering for `error` and `loading`.
 *
 * If you copy/paste it, the only important thing is that you also copy the `useEffect` statement below
 */
export function Await<T, E>({ store, children, error, loading }: Props<T, E>): ReactElement {
    // This triggers updating the data in the store when needed.
    // Apparently it needs to be within `useEffect` because it updates a state hook in a parent component
    // If you copy/paste this component you should keep this line as is
    useEffect(store.triggerUpdate, [store]);

    const renderError = error ?? ((props: ErrorProps<E>) => <DefaultErrorComponent {...props} />);
    const renderLoading = loading ?? (() => <DefaultPendingComponent />);

    return RemoteData.fold(store.current)<ReactElement>(
        (value, isStale) => <div>{children(value, isStale)}</div>,
        () => <>{renderLoading()}</>,
        (errors, retry) => <>{renderError({ errors, retry, storeName: store.storeName })}</>
    );
}

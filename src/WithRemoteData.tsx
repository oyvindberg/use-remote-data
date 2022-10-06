import { ComponentType, ElementType, ReactElement, ReactNode, useEffect } from 'react';
import { RemoteData } from './RemoteData';
import { RemoteDataStore } from './RemoteDataStore';
import { DefaultErrorComponent, ErrorProps } from './DefaultErrorComponent';
import { DefaultPendingComponent } from './DefaultPendingComponent';

interface Props<T> {
    store: RemoteDataStore<T>;
    children: (value: T, isInvalidated: boolean) => ReactNode;
    PendingComponent?: ElementType;
    ErrorComponent?: ComponentType<ErrorProps>;
}

/**
 * This component provides convenient syntax to write code which only handles data which is present.
 *
 * It's expected that you create a local replacement for this component. Either copy/paste this,
 *  or wrap it with your own rendering for `ErrorComponent` and `PendingComponent`.
 *
 * If you copy/paste it, the only important thing is that you also copy the `useEffect` statement below
 */
export function WithRemoteData<T>({
    store,
    children,
    ErrorComponent = DefaultErrorComponent,
    PendingComponent = DefaultPendingComponent,
}: Props<T>): ReactElement {
    // This triggers updating the data in the store when needed.
    // Apparently it needs to be within `useEffect` because it updates a state hook in a parent component
    // If you copy/paste this component you should keep this line as is
    useEffect(store.triggerUpdate, [store]);

    return RemoteData.fold(store.current)<ReactElement>(
        (value, isInvalidated) => <div>{children(value, isInvalidated)}</div>,
        () => <PendingComponent />,
        (errors, retry) => <ErrorComponent errors={errors} retry={retry} storeName={store.storeName} />
    );
}

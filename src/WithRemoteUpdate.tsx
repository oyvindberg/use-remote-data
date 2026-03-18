import { DefaultErrorComponent, ErrorProps } from './DefaultErrorComponent';
import { DefaultPendingComponent } from './DefaultPendingComponent';
import { RemoteUpdateStore } from './RemoteUpdateStore';
import { ComponentType, ElementType, ReactElement, ReactNode } from 'react';

interface Props<T, P, E> {
    store: RemoteUpdateStore<T, P, E>;
    children: (value: T, run: (params: P) => Promise<void>, reset: () => void) => ReactNode;
    idle?: (run: (params: P) => Promise<void>) => ReactNode;
    PendingComponent?: ElementType;
    ErrorComponent?: ComponentType<ErrorProps<E>>;
}

/**
 * Like `WithRemoteData`, but for mutations. Never auto-triggers — fetching only starts when `run()` is called.
 */
export function WithRemoteUpdate<T, P, E>({
    store,
    children,
    idle,
    ErrorComponent = DefaultErrorComponent,
    PendingComponent = DefaultPendingComponent,
}: Props<T, P, E>): ReactElement | null {
    // No useEffect(store.triggerUpdate) — the defining difference from WithRemoteData

    const current = store.current;

    switch (current.type) {
        case 'initial':
            return idle ? <>{idle(store.run)}</> : null;
        case 'pending':
            return <PendingComponent />;
        case 'yes':
            return <>{children(current.value, store.run, store.reset)}</>;
        case 'no':
            return <ErrorComponent errors={current.errors} retry={current.retry} storeName={store.storeName} />;
        case 'invalidated-pending':
            return (
                <>
                    {children(current.invalidated.value, store.run, store.reset)}
                    <PendingComponent />
                </>
            );
        case 'invalidated-initial':
        case 'invalidated-immediate':
            return <>{children(current.invalidated.value, store.run, store.reset)}</>;
    }
}

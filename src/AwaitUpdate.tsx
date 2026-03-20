import { DefaultErrorComponent, ErrorProps } from './DefaultErrorComponent';
import { DefaultPendingComponent } from './DefaultPendingComponent';
import { RemoteUpdateStore } from './RemoteUpdateStore';
import { ReactElement, ReactNode } from 'react';

interface Props<T, P, E> {
    store: RemoteUpdateStore<T, P, E>;
    children: (value: T, run: (params: P) => Promise<void>, reset: () => void) => ReactNode;
    idle?: (run: (params: P) => Promise<void>) => ReactNode;
    loading?: () => ReactNode;
    error?: (props: ErrorProps<E>) => ReactNode;
}

/**
 * Like `Await`, but for mutations. Never auto-triggers — fetching only starts when `run()` is called.
 */
export function AwaitUpdate<T, P, E>({
    store,
    children,
    idle,
    error,
    loading,
}: Props<T, P, E>): ReactElement | null {
    // No useEffect(store.triggerUpdate) — the defining difference from Await

    const renderError = error ?? ((props: ErrorProps<E>) => <DefaultErrorComponent {...props} />);
    const renderLoading = loading ?? (() => <DefaultPendingComponent />);

    const current = store.current;

    switch (current.type) {
        case 'initial':
            return idle ? <>{idle(store.run)}</> : null;
        case 'pending':
            return <>{renderLoading()}</>;
        case 'success':
            return <>{children(current.value, store.run, store.reset)}</>;
        case 'failed':
            return <>{renderError({ errors: current.errors, retry: current.retry, storeName: store.storeName })}</>;
        case 'invalidated-pending':
            return (
                <>
                    {children(current.invalidated.value, store.run, store.reset)}
                    {renderLoading()}
                </>
            );
        case 'invalidated-initial':
        case 'invalidated-immediate':
            return <>{children(current.invalidated.value, store.run, store.reset)}</>;
    }
}

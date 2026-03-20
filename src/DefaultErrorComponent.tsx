import { Failure } from './Failure';
import { WeakError } from './WeakError';

export interface ErrorProps<E> {
    storeName?: string;
    errors: readonly Failure<WeakError, E>[];
    retry: () => Promise<void>;
}

export function DefaultErrorComponent<E>({ storeName, errors, retry }: ErrorProps<E>) {
    const title = storeName ? <strong>Failed request for store {storeName}</strong> : <strong>Failed request</strong>;

    const renderedErrors = errors.map((failure, idx) => {
        const error = failure.value;
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

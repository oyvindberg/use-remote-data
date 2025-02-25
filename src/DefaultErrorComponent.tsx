import { WeakError } from './WeakError';
import { Either } from './Either';

export interface ErrorProps<E> {
    storeName?: string;
    errors: readonly Either<WeakError, E>[];
    retry: () => Promise<void>;
}

export function DefaultErrorComponent<E>({ storeName, errors, retry }: ErrorProps<E>) {
    const title = storeName ? <strong>Failed request for store {storeName}</strong> : <strong>Failed request</strong>;

    const renderedErrors = errors.map((either, idx) => {
        const error = either.value;
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

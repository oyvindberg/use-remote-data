import { FC } from 'react';
import { RemoteData } from './RemoteData';

export interface ErrorProps {
    storeName?: string;
    errors: ReadonlyArray<RemoteData.WeakError>;
    retry: () => Promise<void>;
}

export const DefaultErrorComponent: FC<ErrorProps> = ({ storeName, errors, retry }) => {
    const title = storeName ? <strong>Failed request for store {storeName}</strong> : <strong>Failed request</strong>;

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
};

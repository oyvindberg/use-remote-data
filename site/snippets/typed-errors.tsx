import * as React from 'react';
import {
    Either,
    ErrorProps,
    useRemoteDataEither,
    WithRemoteData,
} from 'use-remote-data';

// let's say we have a graphql schema like this:
export namespace gql {
    export interface Person {
        __typename: 'Person';
        name: string;
        age: number;
    }

    export interface PersonNotFound {
        __typename: 'PersonNotFound';
        reason: string;
    }

    export interface PersonDeleted {
        __typename: 'PersonDeleted';
        reason: string;
    }

    export type PersonError = PersonNotFound | PersonDeleted;
    export type PersonResult = PersonError | Person;

    const values: readonly PersonResult[] = [
        { __typename: 'Person', name: 'Alice', age: 30 },
        { __typename: 'PersonNotFound', reason: 'Person not found' },
        { __typename: 'PersonDeleted', reason: 'Person was deleted' },
    ];
    var i = 0;

    export const fetch = (): Promise<PersonResult> =>
        new Promise((resolve) => {
            i += 1;
            setTimeout(() => resolve(values[i % values.length]), 1000);
        });
}

export function PersonErrorComponent({
    storeName,
    errors,
    retry,
}: ErrorProps<gql.PersonError>) {
    const title = storeName ? (
        <strong>Failed request for store {storeName}</strong>
    ) : (
        <strong>Failed request</strong>
    );

    const renderedErrors = errors.map((either, idx) => {
        if (either.tag === 'right') {
            switch (either.value.__typename) {
                case 'PersonDeleted':
                    return <div key={idx}>Person was deleted</div>;
                case 'PersonNotFound':
                    return <div key={idx}>Person not found</div>;
            }
        } else {
            const error = either.value;
            if (error instanceof Error) {
                return <div key={idx}>{error.message}</div>;
            } else {
                return (
                    <div key={idx}>
                        <pre>
                            <code>{JSON.stringify(error)}</code>
                        </pre>
                    </div>
                );
            }
        }
    });

    return (
        <div>
            {title}
            {renderedErrors}
            <button onClick={retry}>retry</button>
        </div>
    );
}

export const Component: React.FC = () => {
    const store = useRemoteDataEither(async () => {
        const value = await gql.fetch();
        // if you receive a union type like here, it'll be your responsibility
        // to decide if it is a success (right) or an error (left)
        if (value.__typename === 'Person') return Either.right(value);
        else return Either.left(value);
    });

    return (
        <WithRemoteData store={store} ErrorComponent={PersonErrorComponent}>
            {(p) => (
                <p>
                    Name: {p.name}, age: {p.age}
                </p>
            )}
        </WithRemoteData>
    );
};

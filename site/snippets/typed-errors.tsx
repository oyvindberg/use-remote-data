import { Either, ErrorProps, useRemoteDataEither, Await } from 'use-remote-data';

// GraphQL APIs often return union types for errors
type Person = { __typename: 'Person'; name: string; age: number };
type NotFound = { __typename: 'PersonNotFound'; reason: string };
type Deleted = { __typename: 'PersonDeleted'; reason: string };

type PersonError = NotFound | Deleted;
type PersonResult = Person | PersonError;

// Simulate a GraphQL endpoint that cycles through outcomes
const results: PersonResult[] = [
    { __typename: 'Person', name: 'Alice', age: 30 },
    { __typename: 'PersonNotFound', reason: 'No person with that ID' },
    { __typename: 'PersonDeleted', reason: 'Account removed on 2024-01-10' },
];
let i = -1;

function fetchPerson(): Promise<PersonResult> {
    return new Promise((resolve) => {
        i = (i + 1) % results.length;
        setTimeout(() => resolve(results[i]), 800);
    });
}

function PersonErrorView({ errors, retry }: ErrorProps<PersonError>) {
    return (
        <div>
            {errors.map((either, i) =>
                either.tag === 'right' ? (
                    <div key={i}>
                        {either.value.__typename === 'PersonNotFound'
                            ? `Not found: ${either.value.reason}`
                            : `Deleted: ${either.value.reason}`}
                    </div>
                ) : (
                    <div key={i}>
                        Unexpected error: {either.value instanceof Error ? either.value.message : 'unknown'}
                    </div>
                ),
            )}
            <button onClick={retry}>Retry</button>
        </div>
    );
}

export function Component() {
    const store = useRemoteDataEither(async () => {
        const result = await fetchPerson();
        if (result.__typename === 'Person') return Either.right(result);
        return Either.left(result);
    });

    return (
        <Await store={store} error={(props) => <PersonErrorView {...props} />}>
            {(person) => (
                <p>
                    {person.name}, age {person.age}
                </p>
            )}
        </Await>
    );
}

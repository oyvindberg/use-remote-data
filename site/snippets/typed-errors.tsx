import {
    Result,
    ErrorProps,
    useRemoteDataResult,
    Await,
} from 'use-remote-data';

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
            {errors.map((failure, i) =>
                failure.tag === 'expected' ? (
                    <div key={i}>
                        {failure.value.__typename === 'PersonNotFound'
                            ? `Not found: ${failure.value.reason}`
                            : `Deleted: ${failure.value.reason}`}
                    </div>
                ) : (
                    <div key={i}>
                        Unexpected error:{' '}
                        {failure.value instanceof Error
                            ? failure.value.message
                            : 'unknown'}
                    </div>
                )
            )}
            <button onClick={retry}>Retry</button>
        </div>
    );
}

export function Component() {
    const store = useRemoteDataResult(async () => {
        const result = await fetchPerson();
        if (result.__typename === 'Person') return Result.ok(result);
        return Result.err(result);
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

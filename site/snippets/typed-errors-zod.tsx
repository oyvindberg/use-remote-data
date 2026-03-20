import { z } from 'zod';
import { Result, ErrorProps, useRemoteDataResult, Await } from 'use-remote-data';

// Define the shape you expect from the API
const UserSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Must be a valid email'),
    age: z.number().min(0, 'Age must be positive'),
});

type User = z.infer<typeof UserSchema>;

// Simulate an API that sometimes returns bad data
const responses: unknown[] = [
    { name: 'Alice', email: 'alice@example.com', age: 30 },
    { name: '', email: 'not-an-email', age: -5 },
    { name: 'Charlie', email: 'charlie@example.com', age: 25 },
];
let i = -1;

function fetchUser(): Promise<unknown> {
    return new Promise((resolve) => {
        i = (i + 1) % responses.length;
        setTimeout(() => resolve(responses[i]), 800);
    });
}

// Validate the response — if it doesn't match, return
// the ZodError as a typed domain error
async function fetchAndValidateUser(): Promise<Result<User, z.ZodError>> {
    const raw = await fetchUser();
    const result = UserSchema.safeParse(raw);
    if (result.success) return Result.ok(result.data);
    return Result.err(result.error);
}

function UserError({ errors, retry }: ErrorProps<z.ZodError>) {
    return (
        <div>
            {errors.map((failure, i) =>
                failure.tag === 'expected' ? (
                    <div key={i}>
                        <strong>Validation failed:</strong>
                        <ul>
                            {failure.value.issues.map((issue, j) => (
                                <li key={j}>
                                    <code>{issue.path.join('.')}</code>: {issue.message}
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <div key={i}>
                        Unexpected error: {failure.value instanceof Error ? failure.value.message : 'unknown'}
                    </div>
                ),
            )}
            <button onClick={retry}>Retry</button>
        </div>
    );
}

export function Component() {
    const store = useRemoteDataResult(fetchAndValidateUser);

    return (
        <Await store={store} error={(props) => <UserError {...props} />}>
            {(user) => (
                <p>
                    {user.name} ({user.email}), age {user.age}
                </p>
            )}
        </Await>
    );
}

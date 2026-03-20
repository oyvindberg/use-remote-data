import {
    InvalidationStrategy,
    RemoteDataStore,
    useRemoteData,
    Await,
} from 'use-remote-data';

let i = 0;
const freshData = (): Promise<number> =>
    new Promise((resolve) => {
        i += 1;
        setTimeout(() => resolve(i), 1000);
    });

let j = 0;
const failSometimes = (): Promise<number> =>
    new Promise((resolve, reject) => {
        j += 1;
        if (j % 10 === 0) reject(`${j} was dividable by 10`);
        else resolve(j);
    });

export function Component() {
    const one = useRemoteData(freshData, {
        invalidation: InvalidationStrategy.refetchAfterMillis(1000),
    });
    const two = useRemoteData(failSometimes, {
        invalidation: InvalidationStrategy.refetchAfterMillis(100),
    });
    return (
        <Await store={RemoteDataStore.all(one, two)}>
            {([num1, num2]) => (
                <span>
                    {num1} - {num2}
                </span>
            )}
        </Await>
    );
}

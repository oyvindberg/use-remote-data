import { RemoteData } from '../src';
import { Either } from '../src';

test('Pending takes precedence over Initial, Success', async () => {
    expect(RemoteData.all(RemoteData.Success(1, RemoteData.Epoch), RemoteData.Initial, RemoteData.Pending)).toStrictEqual(
        RemoteData.Pending
    );
});
test('Initial takes precedence over Success', async () => {
    expect(RemoteData.all(RemoteData.Initial, RemoteData.Success(1, RemoteData.Epoch))).toStrictEqual(RemoteData.Initial);
});

test('Failed takes precedence over everything', async () => {
    const all: RemoteData<[unknown, unknown, number, number, number, unknown], 'error'> = RemoteData.all(
        RemoteData.Initial,
        RemoteData.Pending,
        RemoteData.Success(1, RemoteData.Epoch),
        RemoteData.InvalidatedPending(RemoteData.Success(1, RemoteData.Epoch)),
        RemoteData.InvalidatedInitial(RemoteData.Success(1, RemoteData.Epoch)),
        RemoteData.Failed([Either.right('error' as const)], () => Promise.reject())
    );
    expect(all.type).toStrictEqual('failed');
});

test('Can combine multiple Success', async () => {
    expect(RemoteData.all(RemoteData.Success(1, new Date(1)), RemoteData.Success(2, new Date(2)))).toStrictEqual(
        RemoteData.Success([1, 2], new Date(2))
    );
});

test('Can combine invalidated data', async () => {
    expect(
        RemoteData.all(RemoteData.Success(1, new Date(1)), RemoteData.InvalidatedInitial(RemoteData.Success(2, new Date(2))))
    ).toStrictEqual(RemoteData.InvalidatedPending(RemoteData.Success([1, 2], new Date(2))));
});

test('can combine invalidated data (2)', async () => {
    expect(
        RemoteData.all(RemoteData.Success(1, new Date(1)), RemoteData.InvalidatedInitial(RemoteData.Success(2, new Date(2))))
    ).toStrictEqual(RemoteData.InvalidatedPending(RemoteData.Success([1, 2], new Date(2))));
});

test('properly combine retries', async () => {
    let value1 = 0;
    let value2 = 0;
    const retry1 = (): Promise<void> =>
        new Promise((ok) => {
            value1 += 1;
            ok();
        });
    const retry2 = (): Promise<void> =>
        new Promise((ok) => {
            value2 += 1;
            ok();
        });

    const combined = RemoteData.all(
        RemoteData.Pending,
        RemoteData.Success(1, RemoteData.Epoch),
        RemoteData.Failed([Either.right('no1')], retry1),
        RemoteData.Failed([Either.right('no2')], retry2)
    );
    if (combined.type === 'failed') {
        await combined.retry();
        expect(combined.errors).toStrictEqual([Either.right('no1'), Either.right('no2')]);
        expect(value1).toStrictEqual(1);
        expect(value2).toStrictEqual(1);
    } else {
        expect(combined.type).toStrictEqual('failed');
    }
});

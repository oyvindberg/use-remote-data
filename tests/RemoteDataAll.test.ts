import { RemoteData } from '../src';

test('Pending takes precedence over Initial, Yes', async () => {
    expect(RemoteData.all(RemoteData.Yes(1), RemoteData.Initial, RemoteData.Pending)).toStrictEqual(RemoteData.Pending);
});
test('Initial takes precedence over Yes', async () => {
    expect(RemoteData.all(RemoteData.Initial, RemoteData.Yes(1))).toStrictEqual(RemoteData.Initial);
});

test('No takes precedence over everything', async () => {
    expect(
        RemoteData.all(
            RemoteData.Initial,
            RemoteData.Pending,
            RemoteData.Yes(1),
            RemoteData.InvalidatedPending(RemoteData.Yes(1)),
            RemoteData.InvalidatedInitial(RemoteData.Yes(1)),
            RemoteData.No(['error'], () => Promise.reject())
        ).type
    ).toStrictEqual('no');
});

test('Can combine multiple Yes', async () => {
    expect(RemoteData.all(RemoteData.Yes(1), RemoteData.Yes(2))).toStrictEqual(RemoteData.Yes([1, 2]));
});

test('Can combine invalidated data', async () => {
    expect(RemoteData.all(RemoteData.Yes(1), RemoteData.InvalidatedInitial(RemoteData.Yes(2)))).toStrictEqual(
        RemoteData.InvalidatedPending(RemoteData.Yes([1, 2]))
    );
});

test('can combine invalidated data (2)', async () => {
    expect(RemoteData.all(RemoteData.Yes(1), RemoteData.InvalidatedInitial(RemoteData.Yes(2)))).toStrictEqual(
        RemoteData.InvalidatedPending(RemoteData.Yes([1, 2]))
    );
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
        RemoteData.Yes(1),
        RemoteData.No(['no1'], retry1),
        RemoteData.No(['no2'], retry2)
    );
    if (combined.type === 'no') {
        await combined.retry();
        expect(combined.errors).toStrictEqual(['no1', 'no2']);
        expect(value1).toStrictEqual(1);
        expect(value2).toStrictEqual(1);
    } else {
        expect(combined.type).toStrictEqual('no');
    }
});

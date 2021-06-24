import { RemoteData } from './RemoteData';
import { isDefined } from './internal/isDefined';

export interface RemoteDataStore<T> {
    readonly triggerUpdate: () => Promise<void> | undefined;
    readonly current: RemoteData<T>;
    // you can supply this through `Options` parameter to `useRemoteData`
    readonly storeName: string | undefined;
}

export namespace RemoteDataStore {
    // create a completely static store. Perfect for storybook and so on
    const always = <T>(current: RemoteData<T>, storeName?: string): RemoteDataStore<T> => ({
        triggerUpdate: () => undefined,
        current,
        storeName,
    });

    export type ValuesFrom<Stores extends [...RemoteDataStore<unknown>[]]> = {
        [K in keyof Stores]: Stores[K] extends RemoteDataStore<infer O> ? O : never;
    };

    // combine many stores into one which will produce a tuple with all values when we have them.
    // think of this as `sequence` from FP
    export const all = <Stores extends RemoteDataStore<unknown>[]>(...stores: Stores): All<Stores> => new All(stores);

    class All<Stores extends RemoteDataStore<unknown>[]> implements RemoteDataStore<ValuesFrom<Stores>> {
        readonly #stores: Stores;

        constructor(stores: Stores) {
            this.#stores = stores;
        }

        triggerUpdate = () => {
            // if the product of all stores is a failure, dont invalidate any succeeding stores where we won't use the result
            if (this.current.type === 'no') {
                return undefined;
            }
            return Promise.all(this.#stores.map((store) => store.triggerUpdate())).then((_) => {});
        };

        get current() {
            const combined = RemoteData.all(...this.#stores.map((store) => store.current));
            // didn't bother to prove this, but we could
            return combined as RemoteData<RemoteDataStore.ValuesFrom<Stores>>;
        }

        get storeName() {
            return this.#stores
              .map((store) => store.storeName)
              .filter(isDefined)
              .join(', ');
        }
    }
}


import { RemoteData } from './RemoteData';
import { isDefined } from './internal/isDefined';
import { MaybeCancel } from './internal/MaybeCancel';

export interface RemoteDataStore<T> {
    readonly triggerUpdate: () => MaybeCancel;
    readonly invalidate: () => void;
    readonly current: RemoteData<T>;
    // you can supply this through `Options` parameter to `useRemoteData`
    readonly storeName: string | undefined;
}

export namespace RemoteDataStore {
    // get a completely static store. Perfect for storybook and so on
    export const always = <T>(current: RemoteData<T>, storeName?: string): RemoteDataStore<T> => ({
        triggerUpdate: () => undefined,
        current,
        storeName,
        invalidate: () => {},
    });

    // get a version of the store which can be rendered immediately
    export const orNull = <T>(store: RemoteDataStore<T>): RemoteDataStore<T | null> => {
        return {
            get current() {
                return RemoteData.Yes(RemoteData.orNull(store.current));
            },
            invalidate: store.invalidate,
            triggerUpdate: store.triggerUpdate,
            storeName: store.storeName,
        };
    };

    export type ValuesFrom<Stores extends [...RemoteDataStore<unknown>[]]> = {
        [K in keyof Stores]: Stores[K] extends RemoteDataStore<infer O> ? O : never;
    };

    // combine many stores into one which will produce a tuple with all values when we have them.
    // think of this as `sequence` from FP
    export const all = <Stores extends RemoteDataStore<unknown>[]>(
        ...stores: Stores
    ): RemoteDataStore<ValuesFrom<Stores>> => new All(stores);

    class All<Stores extends RemoteDataStore<unknown>[]> implements RemoteDataStore<ValuesFrom<Stores>> {
        readonly #stores: Stores;

        constructor(stores: Stores) {
            this.#stores = stores;
        }

        triggerUpdate = (): MaybeCancel => {
            // if the product of all stores is a failure, dont invalidate any successful stores where we won't see the result
            if (this.current.type === 'no') {
                return undefined;
            }
            return MaybeCancel.all(this.#stores.map((store) => store.triggerUpdate()));
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

        invalidate = () => this.#stores.forEach((store) => store.invalidate());
    }
}

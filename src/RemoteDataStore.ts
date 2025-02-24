import { RemoteData } from './RemoteData';
import { isDefined } from './internal/isDefined';
import { MaybeCancel } from './internal/MaybeCancel';

export interface RemoteDataStore<T, E = never> {
    // should always call this when the data inside is meant to be rendered, typically from `WithData`
    readonly triggerUpdate: () => MaybeCancel;
    // you can call this explicitly to force a re-fetch
    readonly invalidate: () => void;
    // fetch current state. will not trigger any side effects
    readonly current: RemoteData<T, E>;
    // for debugging: you can supply this through the ` Options ` parameter to `useRemoteData`
    readonly storeName: string | undefined;

    // combinator: returns a `RemoteDataStore` which will immediately succeed, but the result may be `null`
    readonly orNull: RemoteDataStore<T | null, E>;
    // combinator: map the result of the store
    readonly map: <U>(fn: (value: T) => U) => RemoteDataStore<U, E>;
}

export namespace RemoteDataStore {
    export type ValuesFrom<Stores extends [...RemoteDataStore<unknown, unknown>[]]> = {
        [K in keyof Stores]: Stores[K] extends RemoteDataStore<infer O, unknown> ? O : never;
    };

    export type ErrorsFromArray<Stores extends [...RemoteDataStore<unknown, unknown>[]]> = {
        [K in keyof Stores]: Stores[K] extends RemoteDataStore<unknown, infer E> ? E : never;
    };
    export type ErrorsFrom<Datas extends RemoteDataStore<unknown, unknown>[]> = ErrorsFromArray<Datas>[number];

    // combine many stores into one which will produce a tuple with all values when we have them.
    // think of this as `sequence` from FP
    export const all = <Stores extends RemoteDataStore<unknown, unknown>[]>(
        ...stores: Stores
    ): RemoteDataStore<ValuesFrom<Stores>, ErrorsFrom<Stores>> => new All(stores);

    class All<Stores extends RemoteDataStore<unknown, unknown>[]>
        implements RemoteDataStore<ValuesFrom<Stores>, ErrorsFrom<Stores>>
    {
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
            return combined as RemoteData<RemoteDataStore.ValuesFrom<Stores>, ErrorsFrom<Stores>>;
        }

        get storeName() {
            return this.#stores
                .map((store) => store.storeName)
                .filter(isDefined)
                .join(', ');
        }

        invalidate = () => this.#stores.forEach((store) => store.invalidate());

        get orNull(): RemoteDataStore<ValuesFrom<Stores> | null, ErrorsFrom<Stores>> {
            return RemoteDataStore.orNull(this);
        }

        map<U>(fn: (value: ValuesFrom<Stores>) => U): RemoteDataStore<U, ErrorsFrom<Stores>> {
            return new Mapped(this, fn);
        }
    }

    // get a version of the store which can be rendered immediately
    export const orNull = <T, E>(store: RemoteDataStore<T, E>): RemoteDataStore<T | null, E> => {
        return new OrNull(store);
    };

    class OrNull<T, E> implements RemoteDataStore<T | null, E> {
        readonly #store: RemoteDataStore<T, E>;
        readonly triggerUpdate: () => MaybeCancel;
        readonly invalidate: () => void;

        constructor(store: RemoteDataStore<T, E>) {
            this.#store = store;
            this.triggerUpdate = this.#store.triggerUpdate;
            this.invalidate = this.#store.invalidate;
        }

        get current(): RemoteData.Yes<T | null> {
            const orNulled: [T, Date] | null = RemoteData.orNull(this.#store.current);
            if (orNulled === null) {
                return RemoteData.Yes(null, RemoteData.Epoch);
            } else {
                return RemoteData.Yes(...orNulled);
            }
        }

        get storeName() {
            return this.#store.storeName;
        }

        get orNull(): RemoteDataStore<T | null, E> {
            return new OrNull(this);
        }

        map<U>(fn: (value: T | null) => U): RemoteDataStore<U, E> {
            return new Mapped(this, fn);
        }
    }

    export const map = <T, U, E>(store: RemoteDataStore<T, E>, fn: (value: T) => U): RemoteDataStore<U, E> => {
        return new Mapped(store, fn);
    };

    class Mapped<T, U, E> implements RemoteDataStore<U, E> {
        readonly #store: RemoteDataStore<T, E>;
        readonly #fn: (value: T) => U;
        readonly triggerUpdate: () => MaybeCancel;
        readonly invalidate: () => void;

        constructor(store: RemoteDataStore<T, E>, fn: (value: T) => U) {
            this.#store = store;
            this.#fn = fn;
            this.triggerUpdate = this.#store.triggerUpdate;
            this.invalidate = this.#store.invalidate;
        }

        get current() {
            return RemoteData.map(this.#store.current, this.#fn);
        }

        get storeName() {
            return this.#store.storeName;
        }

        get orNull(): RemoteDataStore<U | null, E> {
            return RemoteDataStore.orNull(this);
        }

        map<V>(fn: (value: U) => V): RemoteDataStore<V, E> {
            return new Mapped(this, fn);
        }
    }

    // get a completely static store. Perfect for storybook and so on
    export const always = <T, E>(current: RemoteData<T, E>, storeName?: string): RemoteDataStore<T, E> =>
        new Always(current, storeName);

    class Always<T, E> implements RemoteDataStore<T, E> {
        readonly current: RemoteData<T, E>;
        readonly storeName: string | undefined;

        constructor(current: RemoteData<T, E>, storeName?: string) {
            this.current = current;
            this.storeName = storeName;
        }

        triggerUpdate = () => undefined;

        invalidate = () => {};

        get orNull(): RemoteDataStore<T | null, E> {
            return RemoteDataStore.orNull(this);
        }

        map<U>(fn: (value: T) => U): RemoteDataStore<U, E> {
            return new Mapped(this, fn);
        }
    }
}

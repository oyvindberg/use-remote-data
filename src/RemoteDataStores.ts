import { RemoteDataStore } from './RemoteDataStore';

export interface RemoteDataStores<K, V> {
    get(key: K): RemoteDataStore<V>;

    getMany(keys: readonly K[]): readonly RemoteDataStore<V>[];
}

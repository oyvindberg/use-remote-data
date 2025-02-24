import { RemoteDataStore } from './RemoteDataStore';

export interface RemoteDataStores<K, V, E = never> {
    get(key: K): RemoteDataStore<V, E>;

    getMany(keys: readonly K[]): readonly RemoteDataStore<V, E>[];
}

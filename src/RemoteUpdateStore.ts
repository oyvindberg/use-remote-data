import { RemoteDataStore } from './RemoteDataStore';

export interface RemoteUpdateStore<T, P = void, E = never> extends RemoteDataStore<T, E> {
    readonly run: (params: P) => Promise<void>;
    readonly reset: () => void;
}

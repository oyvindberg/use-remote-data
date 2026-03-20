import { Failure } from './Failure';
import { WeakError } from './WeakError';

export interface RemoteUpdateOptions<T, E> {
    storeName?: string;
    invalidates?: ReadonlyArray<{ invalidate(): void }>;
    onSuccess?: (value: T) => void;
    onError?: (errors: ReadonlyArray<Failure<WeakError, E>>) => void;
    debug?: Console['warn'];
}

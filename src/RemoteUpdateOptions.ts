import { Either } from './Either';
import { WeakError } from './WeakError';

export interface RemoteUpdateOptions<T, E> {
    storeName?: string;
    invalidates?: ReadonlyArray<{ invalidate(): void }>;
    onSuccess?: (value: T) => void;
    onError?: (errors: ReadonlyArray<Either<WeakError, E>>) => void;
    debug?: Console['warn'];
}

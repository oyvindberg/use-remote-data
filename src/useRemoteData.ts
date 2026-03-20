import { Either } from './Either';
import { Options } from './Options';
import { RemoteDataStore } from './RemoteDataStore';
import { useRemoteDataMapEither } from './useRemoteDataMap';

export const useRemoteData = <T>(run: (signal: AbortSignal) => Promise<T>, options?: Options<T>): RemoteDataStore<T> =>
    useRemoteDataMapEither<undefined, T, never>((_key, signal) => run(signal).then(Either.right), options).get(undefined);

export const useRemoteDataEither = <T, E>(
    run: (signal: AbortSignal) => Promise<Either<E, T>>,
    options?: Options<T>
): RemoteDataStore<T, E> => useRemoteDataMapEither<undefined, T, E>((_key, signal) => run(signal), options).get(undefined);

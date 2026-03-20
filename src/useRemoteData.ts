import { Either } from './Either';
import { Options } from './Options';
import { RemoteDataStore } from './RemoteDataStore';
import { useRemoteDataMapEither } from './useRemoteDataMap';

export const useRemoteData = <T>(run: () => Promise<T>, options?: Options<T>): RemoteDataStore<T> =>
    useRemoteDataMapEither<undefined, T, never>(() => run().then(Either.right), options).get(undefined);

export const useRemoteDataEither = <T, E>(
    run: () => Promise<Either<E, T>>,
    options?: Options<T>
): RemoteDataStore<T, E> => useRemoteDataMapEither<undefined, T, E>(run, options).get(undefined);

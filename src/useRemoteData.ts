import { RemoteDataStore } from './RemoteDataStore';
import { useRemoteDatasEither } from './useRemoteDatas';
import { Options } from './Options';
import { Either } from './Either';

export const useRemoteData = <T>(run: () => Promise<T>, options?: Options<T>): RemoteDataStore<T> =>
    useRemoteDatasEither<undefined, T, never>(() => run().then(Either.right), options).get(undefined);

export const useRemoteDataEither = <T, E>(run: () => Promise<Either<E, T>>, options?: Options<T>): RemoteDataStore<T, E> =>
    useRemoteDatasEither<undefined, T, E>(run, options).get(undefined);

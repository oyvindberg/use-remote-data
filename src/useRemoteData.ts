import { Failure } from './Failure';
import { Options } from './Options';
import { RemoteDataStore } from './RemoteDataStore';
import { useRemoteDataMapCore } from './useRemoteDataMap';

export const useRemoteData = <T>(run: (signal: AbortSignal) => Promise<T>, options?: Options<T>): RemoteDataStore<T> =>
    useRemoteDataMapCore<undefined, T, never>((_key, signal) => run(signal).then(Failure.expected), options).get(undefined);

export const useRemoteDataEither = <T, E>(
    run: (signal: AbortSignal) => Promise<Failure<E, T>>,
    options?: Options<T>
): RemoteDataStore<T, E> => useRemoteDataMapCore<undefined, T, E>((_key, signal) => run(signal), options).get(undefined);

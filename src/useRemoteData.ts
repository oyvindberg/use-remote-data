import { Result } from './Result';
import { Options } from './Options';
import { RemoteDataStore } from './RemoteDataStore';
import { useRemoteDataMapCore } from './useRemoteDataMap';

export const useRemoteData = <T>(run: (signal: AbortSignal) => Promise<T>, options?: Options<T>): RemoteDataStore<T> =>
    useRemoteDataMapCore<undefined, T, never>((_key, signal) => run(signal).then(Result.ok), options).get(undefined);

export const useRemoteDataResult = <T, E>(
    run: (signal: AbortSignal) => Promise<Result<T, E>>,
    options?: Options<T>
): RemoteDataStore<T, E> => useRemoteDataMapCore<undefined, T, E>((_key, signal) => run(signal), options).get(undefined);

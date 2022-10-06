import { RemoteDataStore } from './RemoteDataStore';
import { useRemoteDatas } from './useRemoteDatas';
import { Options } from './Options';

export const useRemoteData = <T>(run: () => Promise<T>, options?: Options): RemoteDataStore<T> =>
    useRemoteDatas<undefined, T>(run, options).get(undefined);

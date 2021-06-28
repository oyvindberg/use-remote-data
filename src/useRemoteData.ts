import { DependencyList } from 'react';
import { RemoteDataStore } from './RemoteDataStore';
import { useRemoteDatas } from './useRemoteDatas';

export interface Options {
    debug?: boolean;
    storeName?: string;
    ttlMillis?: number;
    dependencies?: DependencyList;
}

export const useRemoteData = <T>(run: () => Promise<T>, options?: Options): RemoteDataStore<T> =>
    useRemoteDatas<undefined, T>(run, options).get(undefined);

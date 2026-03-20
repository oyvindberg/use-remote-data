import { RefreshStrategy } from './RefreshStrategy';
import { RemoteData } from './RemoteData';
import { DependencyList } from 'react';

export interface Options<T> {
    debug?: Console['warn'];
    storeName?: string;
    refresh?: RefreshStrategy<T>;
    dependencies?: DependencyList;
    initial?: RemoteData<T>;
}

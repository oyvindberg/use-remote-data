import { DependencyList } from 'react';

export interface Options {
    debug?: boolean;
    storeName?: string;
    ttlMillis?: number;
    dependencies?: DependencyList;
}

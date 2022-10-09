import { DependencyList } from 'react';
import { InvalidationStrategy } from './InvalidationStrategy';

export interface Options<T> {
    debug?: boolean;
    storeName?: string;
    invalidation?: InvalidationStrategy<T>;
    dependencies?: DependencyList;
}

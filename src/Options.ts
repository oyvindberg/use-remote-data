import { InvalidationStrategy } from './InvalidationStrategy';
import { DependencyList } from 'react';

export interface Options<T> {
    debug?: Console['warn'];
    storeName?: string;
    invalidation?: InvalidationStrategy<T>;
    dependencies?: DependencyList;
}

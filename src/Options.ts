import { DependencyList } from 'react';
import { InvalidationStrategy } from './InvalidationStrategy';

export interface Options<T> {
    debug?: Console['warn'];
    storeName?: string;
    invalidation?: InvalidationStrategy<T>;
    dependencies?: DependencyList;
}

import { RefreshStrategy } from './RefreshStrategy';

export interface SharedStoreOptions<T> {
    refresh?: RefreshStrategy<T>;
    debug?: Console['warn'];
    /**
     * Grace period in milliseconds before cleaning up after the last subscriber unmounts.
     * Analogous to react-query's `gcTime` / `cacheTime`.
     *
     * When undefined or 0, cleanup is immediate.
     * Useful for tab navigation where components unmount and remount quickly.
     */
    gcTime?: number;
}

import { DependencyList } from 'react';

/** Shallow element-by-element comparison using Object.is, matching React's dependency semantics. */
export function depsChanged(
    prev: DependencyList | undefined,
    current: DependencyList | undefined
): boolean {
    if (prev === current) return false;
    if (prev === undefined || current === undefined) return true;
    if (prev.length !== current.length) return true;
    for (let i = 0; i < prev.length; i++) {
        if (!Object.is(prev[i], current[i])) return true;
    }
    return false;
}

import { isDefined } from './internal/isDefined';

// a function which may cancel an ongoing effect.
// it's consumed by `useEffect` which will call it on unmount.
export type CancelTimeout = (() => void) | undefined;

export namespace CancelTimeout {
    export const all = (ts: readonly CancelTimeout[]): CancelTimeout => {
        const defined = ts.filter(isDefined);
        if (defined.length === 0) {
            return undefined;
        }
        return () => defined.forEach((t) => t());
    };
}

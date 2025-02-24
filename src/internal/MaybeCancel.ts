import { isDefined } from './isDefined';

// a function which may cancel an ongoing effect.
// it's consumed by `useEffect` which will call it on unmount.
export type MaybeCancel = (() => void) | undefined;

export namespace MaybeCancel {
    export const all = (ts: readonly MaybeCancel[]): MaybeCancel => {
        const defined = ts.filter(isDefined);
        if (defined.length === 0) {
            return undefined;
        }
        return () => defined.forEach((t) => t());
    };
}

import { isDefined } from './isDefined';

// a function which may cancel an ongoing effect
export type MaybeCancel = (() => void) | undefined;

export namespace MaybeCancel {
    export const all = (ts: ReadonlyArray<MaybeCancel>): MaybeCancel => {
        const defined = ts.filter(isDefined);
        if (defined.length === 0) {
            return undefined;
        }
        return () => defined.forEach((t) => t());
    };
}

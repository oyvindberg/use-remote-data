export const isDefined = <T>(t: T | null | undefined): t is T => t !== null && t !== void 0;

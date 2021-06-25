type DefinedTypes = object | number | boolean | symbol | string;

// this exists for type inference
export const isDefined = <T extends DefinedTypes>(t: T | null | undefined): t is T => t !== null && t !== void 0;

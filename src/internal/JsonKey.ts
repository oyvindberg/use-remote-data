export type JsonKey<T> = string & { tag?: 'JsonKey' };

export namespace JsonKey {
    export const of = <T>(value: T): JsonKey<T> =>
        (value === undefined ? 'undefined' : JSON.stringify(value)) as JsonKey<T>;
}

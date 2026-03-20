export type Result<T, E> = Result.Ok<T> | Result.Err<E>;

export namespace Result {
    export type Ok<T> = { tag: 'ok'; value: T };
    export type Err<E> = { tag: 'err'; value: E };

    export const ok = <T>(value: T): Ok<T> => ({ tag: 'ok', value });
    export const err = <E>(value: E): Err<E> => ({ tag: 'err', value });
}

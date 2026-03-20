export type Failure<Unexpected, Expected> = Failure.Unexpected<Unexpected> | Failure.Expected<Expected>;

export namespace Failure {
    export type Unexpected<L> = { tag: 'unexpected'; value: L };
    export type Expected<R> = { tag: 'expected'; value: R };

    export const unexpected = <L>(value: L): Unexpected<L> => ({ tag: 'unexpected', value });
    export const expected = <R>(value: R): Expected<R> => ({ tag: 'expected', value });
}

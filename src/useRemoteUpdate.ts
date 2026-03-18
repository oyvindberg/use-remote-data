import { Either } from './Either';
import { RemoteData } from './RemoteData';
import { RemoteDataStore } from './RemoteDataStore';
import { RemoteUpdateOptions } from './RemoteUpdateOptions';
import { RemoteUpdateStore } from './RemoteUpdateStore';
import { WeakError } from './WeakError';
import { useCallback, useEffect, useRef, useState, version } from 'react';

const reactMajor = Number(version.split('.')[0]);

export const useRemoteUpdate = <T, P = void, E = never>(
    run: (params: P) => Promise<T>,
    options?: RemoteUpdateOptions<T, E>
): RemoteUpdateStore<T, P, E> =>
    useRemoteUpdateEither<T, P, E>((params) => run(params).then(Either.right), options);

export const useRemoteUpdateEither = <T, P = void, E = never>(
    run: (params: P) => Promise<Either<E, T>>,
    options?: RemoteUpdateOptions<T, E>
): RemoteUpdateStore<T, P, E> => {
    const [state, setState] = useState<RemoteData<T, E>>(RemoteData.Initial);
    const fetcherRef = useRef(run);
    const optionsRef = useRef(options);
    const requestIdRef = useRef(0);

    fetcherRef.current = run;
    optionsRef.current = options;

    // for react 17: we're not allowed to update state after unmount
    const canUpdateRef = useRef(true);
    if (reactMajor < 18) {
        useEffect(
            () => () => {
                canUpdateRef.current = false;
            },
            []
        );
    }

    const runFn = useCallback((params: P): Promise<void> => {
        const requestId = ++requestIdRef.current;
        setState((prev) => RemoteData.pendingStateFor(prev));

        try {
            return fetcherRef.current(params)
                .then((either) => {
                    if (requestIdRef.current !== requestId || !canUpdateRef.current) return;
                    const opts = optionsRef.current;
                    switch (either.tag) {
                        case 'left': {
                            const errors: readonly Either<WeakError, E>[] = [Either.right(either.value)];
                            setState(RemoteData.No(errors, () => runFn(params)));
                            opts?.onError?.(errors);
                            break;
                        }
                        case 'right': {
                            const value = either.value;
                            setState(RemoteData.Yes(value, new Date()));
                            opts?.invalidates?.forEach((s) => s.invalidate());
                            opts?.onSuccess?.(value);
                            break;
                        }
                    }
                })
                .catch((error: WeakError) => {
                    if (requestIdRef.current !== requestId || !canUpdateRef.current) return;
                    const opts = optionsRef.current;
                    const errors: readonly Either<WeakError, E>[] = [Either.left(error)];
                    setState(RemoteData.No(errors, () => runFn(params)));
                    opts?.onError?.(errors);
                });
        } catch (error: WeakError) {
            const errors: readonly Either<WeakError, E>[] = [Either.left(error)];
            setState(RemoteData.No(errors, () => runFn(params)));
            optionsRef.current?.onError?.(errors);
            return Promise.resolve();
        }
    }, []);

    const reset = useCallback(() => {
        requestIdRef.current++;
        setState(RemoteData.Initial);
    }, []);

    return {
        run: runFn,
        reset,
        triggerUpdate: () => undefined,
        invalidate: reset,
        get current() {
            return state;
        },
        storeName: options?.storeName,
        get orNull(): RemoteDataStore<T | null, E> {
            return RemoteDataStore.orNull(this);
        },
        map<U>(fn: (value: T) => U): RemoteDataStore<U, E> {
            return RemoteDataStore.map(this, fn);
        },
    };
};

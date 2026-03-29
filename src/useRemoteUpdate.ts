import { Failure } from './Failure';
import { RemoteData } from './RemoteData';
import { RemoteDataStore } from './RemoteDataStore';
import { RemoteUpdateOptions } from './RemoteUpdateOptions';
import { RemoteUpdateStore } from './RemoteUpdateStore';
import { Result } from './Result';
import { WeakError } from './WeakError';
import { useCallback, useEffect, useRef, useState } from 'react';

export const useRemoteUpdate = <T, P = void, E = never>(
    run: (params: P, signal: AbortSignal) => Promise<T>,
    options?: RemoteUpdateOptions<T, E>
): RemoteUpdateStore<T, P, E> =>
    useRemoteUpdateResult<T, P, E>((params, signal) => run(params, signal).then(Result.ok), options);

export const useRemoteUpdateResult = <T, P = void, E = never>(
    run: (params: P, signal: AbortSignal) => Promise<Result<T, E>>,
    options?: RemoteUpdateOptions<T, E>
): RemoteUpdateStore<T, P, E> => {
    const [state, setState] = useState<RemoteData<T, E>>(RemoteData.Initial);
    const fetcherRef = useRef(run);
    const optionsRef = useRef(options);
    const requestIdRef = useRef(0);
    const abortControllerRef = useRef<AbortController | null>(null);

    // sync refs after commit so stable callbacks always read fresh values
    useEffect(() => {
        fetcherRef.current = run;
        optionsRef.current = options;
    });

    // abort in-flight request on unmount
    useEffect(
        () => () => {
            abortControllerRef.current?.abort();
        },
        []
    );

    const debugLog = (msg: string, ...args: unknown[]) => {
        const opts = optionsRef.current;
        if (opts?.debug) {
            const prefix = opts.storeName ?? 'useRemoteUpdate';
            opts.debug(`${prefix} ${msg}`, ...args);
        }
    };

    const runFn = useCallback((params: P): Promise<void> => {
        const requestId = ++requestIdRef.current;

        // abort previous in-flight request
        abortControllerRef.current?.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        debugLog('run() called, transitioning to pending');
        setState((prev) => RemoteData.pendingStateFor(prev));

        try {
            return fetcherRef
                .current(params, controller.signal)
                .then((result) => {
                    if (controller.signal.aborted) return;
                    if (requestIdRef.current !== requestId) return;
                    const opts = optionsRef.current;
                    switch (result.tag) {
                        case 'err': {
                            const errors: readonly Failure<WeakError, E>[] = [Failure.expected(result.value)];
                            debugLog('domain error =>', result.value);
                            setState(RemoteData.Failed(errors, () => runFn(params)));
                            opts?.onError?.(errors);
                            break;
                        }
                        case 'ok': {
                            const value = result.value;
                            debugLog('success =>', value);
                            setState(RemoteData.Success(value, new Date()));
                            opts?.refreshes?.forEach((s) => s.refresh());
                            opts?.onSuccess?.(value);
                            break;
                        }
                    }
                })
                .catch((error: WeakError) => {
                    if (controller.signal.aborted) return;
                    if (requestIdRef.current !== requestId) return;
                    const opts = optionsRef.current;
                    debugLog('unexpected error =>', error);
                    const errors: readonly Failure<WeakError, E>[] = [Failure.unexpected(error)];
                    setState(RemoteData.Failed(errors, () => runFn(params)));
                    opts?.onError?.(errors);
                });
        } catch (error: WeakError) {
            debugLog('synchronous error =>', error);
            const errors: readonly Failure<WeakError, E>[] = [Failure.unexpected(error)];
            setState(RemoteData.Failed(errors, () => runFn(params)));
            optionsRef.current?.onError?.(errors);
            return Promise.resolve();
        }
    }, []);

    const reset = useCallback(() => {
        debugLog('reset() called, transitioning to initial');
        abortControllerRef.current?.abort();
        requestIdRef.current++;
        setState(RemoteData.Initial);
    }, []);

    return {
        run: runFn,
        reset,
        triggerUpdate: () => undefined,
        refresh: reset,
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

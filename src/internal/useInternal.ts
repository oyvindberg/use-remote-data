import { useEffect, useRef } from 'react';

const noop: () => void = () => {};

// copied from react-use
export const useInterval = (callback: () => void, delay: number | null) => {
    const savedCallback = useRef(noop);

    useEffect(() => (savedCallback.current = callback));

    useEffect(() => {
        if (delay !== null) {
            const interval = setInterval(savedCallback.current, delay);
            return () => clearInterval(interval);
        }
        return undefined;
    }, [delay]);
};

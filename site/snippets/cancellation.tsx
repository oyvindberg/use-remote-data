import { useState } from 'react';
import { useRemoteData, Await } from 'use-remote-data';

let abortCount = 0;

// simulates a search API that respects AbortSignal
function search(query: string, signal: AbortSignal): Promise<string[]> {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(
            () => resolve([`"${query}" — result 1`, `"${query}" — result 2`, `"${query}" — result 3`]),
            800
        );
        signal.addEventListener('abort', () => {
            clearTimeout(timeout);
            abortCount++;
            reject(new DOMException('Aborted', 'AbortError'));
        });
    });
}

export function Component() {
    const [query, setQuery] = useState('react');

    const store = useRemoteData(
        (signal) => search(query, signal),
        { dependencies: [query] }
    );

    return (
        <div>
            <input
                value={query}
                onChange={(e) => setQuery(e.currentTarget.value)}
                placeholder="Type to search..."
            />
            <p style={{ fontSize: '0.85em', color: 'gray' }}>
                Aborted requests: {abortCount}
            </p>
            <Await store={store}>
                {(results, isStale) => (
                    <ul style={{ opacity: isStale ? 0.6 : 1 }}>
                        {results.map((r, i) => (
                            <li key={i}>{r}</li>
                        ))}
                    </ul>
                )}
            </Await>
        </div>
    );
}

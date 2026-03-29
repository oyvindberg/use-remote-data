import { useState } from 'react';
import { Await, useRemoteDataMap } from 'use-remote-data';

// Simulated API — returns 5 items per page and a next cursor
interface Page {
    items: string[];
    nextCursor: number | null;
}

let fetchCount = 0;

const fetchPage = (cursor: number): Promise<Page> =>
    new Promise((resolve, reject) => {
        setTimeout(() => {
            fetchCount++;
            // Simulate a random failure on ~every 4th fetch
            if (fetchCount % 4 === 0) {
                reject(new Error('Network error'));
                return;
            }
            const items = Array.from({ length: 5 }, (_, i) => {
                const n = cursor + i + 1;
                return `Item #${n}`;
            });
            const nextCursor = cursor + 5 < 25 ? cursor + 5 : null;
            resolve({ items, nextCursor });
        }, 600);
    });

export function Component() {
    const [cursors, setCursors] = useState([0]);
    const pages = useRemoteDataMap<number, Page>(
        (cursor) => fetchPage(cursor)
    );

    const loadMore = (nextCursor: number) =>
        setCursors((prev) =>
            prev.includes(nextCursor) ? prev : [...prev, nextCursor]
        );

    return (
        <div>
            {cursors.map((cursor) => (
                <Await
                    key={cursor}
                    store={pages.get(cursor)}
                    loading={() => <p style={{ color: 'gray' }}>Loading page...</p>}
                    error={({ retry }) => (
                        <div style={{ color: 'red' }}>
                            <p>Failed to load page.</p>
                            <button onClick={retry}>Retry this page</button>
                        </div>
                    )}
                >
                    {(page) => (
                        <>
                            {page.items.map((item) => (
                                <p key={item}>{item}</p>
                            ))}
                            {page.nextCursor !== null && (
                                <button onClick={() => loadMore(page.nextCursor!)}>
                                    Load more
                                </button>
                            )}
                        </>
                    )}
                </Await>
            ))}
        </div>
    );
}

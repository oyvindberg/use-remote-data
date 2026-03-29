import React, { useState } from 'react';
import { RemoteDataDevtools } from 'use-remote-data';

export default function Root({ children }: { children: React.ReactNode }) {
    const [show, setShow] = useState(false);

    return (
        <>
            {children}
            <button
                onClick={() => setShow((s) => !s)}
                style={{
                    position: 'fixed',
                    bottom: 8,
                    left: 8,
                    zIndex: 100000,
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: 11,
                    padding: '4px 10px',
                    background: show ? '#333' : '#1a1a1a',
                    color: show ? '#0f0' : '#888',
                    border: '1px solid #333',
                    borderRadius: 4,
                    cursor: 'pointer',
                    opacity: show ? 1 : 0.5,
                }}
                title="Toggle use-remote-data devtools"
            >
                urd
            </button>
            {show && <RemoteDataDevtools position="bottom-right" />}
        </>
    );
}

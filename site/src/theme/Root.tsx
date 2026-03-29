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
                    bottom: 12,
                    left: 12,
                    zIndex: 100000,
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: 13,
                    fontWeight: 'bold',
                    padding: '6px 14px',
                    background: show ? '#0a0' : '#222',
                    color: show ? '#fff' : '#0f0',
                    border: '2px solid #0f0',
                    borderRadius: 6,
                    cursor: 'pointer',
                }}
                title="Toggle use-remote-data devtools"
            >
                {show ? '✕ devtools' : '⚡ devtools'}
            </button>
            {show && <RemoteDataDevtools position="bottom-right" />}
        </>
    );
}

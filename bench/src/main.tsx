import { createRoot } from 'react-dom/client';
import React, { useState, useCallback } from 'react';
import { runBenchmark, type BenchResult } from './harness';
import { rawScenario, urdOldScenario, urdScenario, rqScenario } from './scenarios';

const SCENARIOS = [rawScenario, urdOldScenario, urdScenario, rqScenario];

function App() {
    const [n, setN] = useState(1000);
    const [iters, setIters] = useState(5);
    const [running, setRunning] = useState(false);
    const [status, setStatus] = useState('Ready.');
    const [results, setResults] = useState<BenchResult[] | null>(null);

    const run = useCallback(async () => {
        setRunning(true);
        setResults(null);
        await new Promise((r) => setTimeout(r, 50));

        const res = await runBenchmark(SCENARIOS, n, iters, setStatus);
        setResults(res);
        setStatus('Done.');
        setRunning(false);
    }, [n, iters]);

    return (
        <div>
            <h1>use-remote-data benchmark</h1>
            <div>
                <label>
                    Components:{' '}
                    <input
                        type="number"
                        value={n}
                        onChange={(e) => setN(Number(e.target.value))}
                        style={{ width: 80, fontFamily: 'inherit' }}
                    />
                </label>
                {' '}
                <label>
                    Iterations:{' '}
                    <input
                        type="number"
                        value={iters}
                        onChange={(e) => setIters(Number(e.target.value))}
                        style={{ width: 60, fontFamily: 'inherit' }}
                    />
                </label>
                {' '}
                <button onClick={run} disabled={running}>
                    {running ? 'Running...' : 'Run Benchmark'}
                </button>
            </div>
            <p className={running ? 'running' : 'done'} style={{ marginTop: 8 }}>
                {status}
            </p>

            {results && <ResultsTable results={results} />}
        </div>
    );
}

function ResultsTable({ results }: { results: BenchResult[] }) {
    const fmt = (ms: number) => ms.toFixed(1);
    const best = (field: keyof Omit<BenchResult, 'name'>) =>
        Math.min(...results.map((r) => r[field]));

    const cell = (val: number, bestVal: number) => {
        const isBest = Math.abs(val - bestVal) < 0.5;
        return (
            <td style={isBest ? { color: '#0f0', fontWeight: 'bold' } : {}}>
                {fmt(val)}
            </td>
        );
    };

    // find the raw baseline for "overhead" column
    const raw = results.find((r) => r.name.includes('raw'));

    return (
        <>
            <table>
                <thead>
                    <tr>
                        <th>Scenario</th>
                        <th>Mount (ms)</th>
                        <th>Re-render (ms)</th>
                        <th>Full lifecycle (ms)</th>
                    </tr>
                </thead>
                <tbody>
                    {results.map((r) => (
                        <tr key={r.name}>
                            <td>{r.name}</td>
                            {cell(r.mountMs, best('mountMs'))}
                            {cell(r.rerenderMs, best('rerenderMs'))}
                            {cell(r.fullLifecycleMs, best('fullLifecycleMs'))}
                        </tr>
                    ))}
                </tbody>
            </table>
            {raw && (
                <table style={{ marginTop: 16 }}>
                    <thead>
                        <tr>
                            <th>Library overhead vs raw React</th>
                            <th>Mount</th>
                            <th>Re-render</th>
                            <th>Full lifecycle</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results
                            .filter((r) => !r.name.includes('raw'))
                            .map((r) => (
                                <tr key={r.name}>
                                    <td>{r.name}</td>
                                    <td>{((r.mountMs / raw.mountMs - 1) * 100).toFixed(0)}%</td>
                                    <td>{((r.rerenderMs / raw.rerenderMs - 1) * 100).toFixed(0)}%</td>
                                    <td>{((r.fullLifecycleMs / raw.fullLifecycleMs - 1) * 100).toFixed(0)}%</td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            )}
        </>
    );
}

createRoot(document.getElementById('app')!).render(<App />);

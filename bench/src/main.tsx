import { createRoot } from 'react-dom/client';
import React, { useState, useCallback } from 'react';
import { runBenchmark, type BenchResult } from './harness';
import {
    rawScenario,
    urdScenario,
    rqScenario,
    withKeyMapping,
} from './scenarios';

interface RunConfig {
    label: string;
    uniqueKeys: number;
    results: BenchResult[];
}

function App() {
    const [n, setN] = useState(1000);
    const [iters, setIters] = useState(5);
    const [running, setRunning] = useState(false);
    const [status, setStatus] = useState('Ready.');
    const [runs, setRuns] = useState<RunConfig[] | null>(null);

    const run = useCallback(async () => {
        setRunning(true);
        setRuns(null);
        await new Promise((r) => setTimeout(r, 50));

        const tiers = [
            { uniqueKeys: n, label: `${n} unique (no sharing)` },
            { uniqueKeys: Math.max(1, Math.round(n / 2)), label: `${Math.max(1, Math.round(n / 2))} unique (2x sharing)` },
            { uniqueKeys: Math.max(1, Math.round(n / 10)), label: `${Math.max(1, Math.round(n / 10))} unique (10x sharing)` },
            { uniqueKeys: Math.max(1, Math.round(n / 100)), label: `${Math.max(1, Math.round(n / 100))} unique (100x sharing)` },
            { uniqueKeys: 1, label: `1 unique (all same)` },
        ];

        const allRuns: RunConfig[] = [];

        for (const tier of tiers) {
            setStatus(`Running: ${tier.label}...`);
            await new Promise((r) => setTimeout(r, 30));

            const scenarios = [
                withKeyMapping(rawScenario, tier.uniqueKeys),
                withKeyMapping(urdScenario, tier.uniqueKeys),
                withKeyMapping(rqScenario, tier.uniqueKeys),
            ];

            const results = await runBenchmark(scenarios, n, iters, (msg) =>
                setStatus(`${tier.label}: ${msg}`)
            );
            allRuns.push({ label: tier.label, uniqueKeys: tier.uniqueKeys, results });
        }

        setRuns(allRuns);
        setStatus('Done.');
        setRunning(false);
    }, [n, iters]);

    return (
        <div>
            <h1>use-remote-data benchmark</h1>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <label>
                    Components:{' '}
                    <input
                        type="number"
                        value={n}
                        onChange={(e) => setN(Number(e.target.value))}
                        style={{ width: 80, fontFamily: 'inherit' }}
                    />
                </label>
                <label>
                    Iterations:{' '}
                    <input
                        type="number"
                        value={iters}
                        onChange={(e) => setIters(Number(e.target.value))}
                        style={{ width: 60, fontFamily: 'inherit' }}
                    />
                </label>
                <button onClick={run} disabled={running}>
                    {running ? 'Running...' : 'Run Benchmark'}
                </button>
            </div>
            <p className={running ? 'running' : 'done'} style={{ marginTop: 8 }}>
                {status}
            </p>

            {runs && runs.map((r) => (
                <ResultsTable key={r.label} config={r} />
            ))}
        </div>
    );
}

function ResultsTable({ config }: { config: RunConfig }) {
    const { label, results } = config;
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

    return (
        <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 14, marginBottom: 4 }}>{label}</h3>
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
        </div>
    );
}

createRoot(document.getElementById('app')!).render(<App />);

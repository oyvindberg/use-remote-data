import { type BenchResult, runBenchmark } from './harness';
import { rawScenario, rqScenario, urdScenario } from './scenarios';
import React, { useCallback, useState } from 'react';
import { createRoot } from 'react-dom/client';

const SCENARIOS = [rawScenario, urdScenario, rqScenario];

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

        const k = (divisor: number) => Math.max(1, Math.round(n / divisor));
        const tiers = [
            { uniqueKeys: n, label: `${n} resources, each fetched by 1 component` },
            { uniqueKeys: k(2), label: `${k(2)} resources, each fetched by 2 components` },
            { uniqueKeys: k(10), label: `${k(10)} resources, each fetched by 10 components` },
            { uniqueKeys: k(100), label: `${k(100)} resources, each fetched by 100 components` },
            { uniqueKeys: 1, label: `1 resource fetched by all ${n} components` },
        ];

        const allRuns: RunConfig[] = [];

        for (const tier of tiers) {
            setStatus(`Running: ${tier.label}...`);
            await new Promise((r) => setTimeout(r, 30));

            const results = await runBenchmark(SCENARIOS, n, tier.uniqueKeys, iters, (msg) =>
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

            {runs && runs.map((r) => <ResultsTable key={r.label} config={r} />)}
        </div>
    );
}

function ResultsTable({ config }: { config: RunConfig }) {
    const { label, results } = config;
    const fmt = (ms: number) => (ms < 0 ? 'T/O' : ms.toFixed(1));
    const validResults = (field: keyof Omit<BenchResult, 'name'>) => results.map((r) => r[field]).filter((v) => v >= 0);
    const best = (field: keyof Omit<BenchResult, 'name'>) => {
        const valid = validResults(field);
        return valid.length > 0 ? Math.min(...valid) : -1;
    };

    const cell = (val: number, bestVal: number) => {
        if (val < 0) return <td style={{ color: '#f55' }}>T/O</td>;
        const isBest = bestVal >= 0 && Math.abs(val - bestVal) < 0.5;
        return <td style={isBest ? { color: '#0f0', fontWeight: 'bold' } : {}}>{fmt(val)}</td>;
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

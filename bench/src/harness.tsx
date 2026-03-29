/**
 * Benchmark harness. Renders N components offscreen, measures timings,
 * reports results. Each scenario gets the same treatment.
 */
import { createRoot } from 'react-dom/client';
import React, { useState } from 'react';

export interface Scenario {
    name: string;
    Item: React.FC<{ id: number }>;
    Wrapper?: React.FC<{ children: React.ReactNode }>;
}

export interface BenchResult {
    name: string;
    mountMs: number;
    rerenderMs: number;
    fullLifecycleMs: number;
}

function renderOffscreen(element: React.ReactElement): { root: ReturnType<typeof createRoot>; container: HTMLDivElement } {
    const container = document.createElement('div');
    document.getElementById('stage')!.appendChild(container);
    const root = createRoot(container);
    root.render(element);
    return { root, container };
}

function cleanup(root: ReturnType<typeof createRoot>, container: HTMLDivElement) {
    root.unmount();
    container.remove();
}

/** Wait until `predicate` returns true, polling via microtask + rAF. */
function waitUntil(predicate: () => boolean, timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
        const deadline = performance.now() + timeout;
        const check = () => {
            if (predicate()) {
                resolve();
            } else if (performance.now() > deadline) {
                reject(new Error('waitUntil timed out'));
            } else {
                // tight poll: setTimeout(0) resolves in ~1-4ms (vs rAF ~16ms)
                setTimeout(check, 0);
            }
        };
        setTimeout(check, 0);
    });
}

// ---------------------------------------------------------------------------
// Mount: render N items, wait for first commit
// ---------------------------------------------------------------------------

async function measureMount(scenario: Scenario, n: number, iters: number): Promise<number> {
    const times: number[] = [];
    const Wrap = scenario.Wrapper ?? React.Fragment;

    for (let i = 0; i < iters; i++) {
        const start = performance.now();
        const { root, container } = renderOffscreen(
            <Wrap>
                {Array.from({ length: n }, (_, j) => <scenario.Item key={j} id={j} />)}
            </Wrap>
        );
        // wait for React to commit (at least one DOM node from our items)
        await waitUntil(() => container.querySelectorAll('span').length >= n, 10000);
        times.push(performance.now() - start);
        cleanup(root, container);
        await new Promise((r) => setTimeout(r, 30));
    }

    times.sort((a, b) => a - b);
    return times[Math.floor(times.length / 2)];
}

// ---------------------------------------------------------------------------
// Re-render: mount once, then trigger parent state changes
// ---------------------------------------------------------------------------

async function measureRerender(scenario: Scenario, n: number, iters: number): Promise<number> {
    const Wrap = scenario.Wrapper ?? React.Fragment;
    let triggerRerender: (() => void) | null = null;

    function Parent() {
        const [tick, setTick] = useState(0);
        triggerRerender = () => setTick((t) => t + 1);
        return (
            <Wrap>
                {Array.from({ length: n }, (_, j) => <scenario.Item key={j} id={j} />)}
                <span data-tick>{tick}</span>
            </Wrap>
        );
    }

    const { root, container } = renderOffscreen(<Parent />);
    // wait for initial mount + fetches to settle
    await waitUntil(() => container.querySelectorAll('[data-resolved]').length >= n, 15000);
    // extra settle time
    await new Promise((r) => setTimeout(r, 100));

    const times: number[] = [];
    for (let i = 0; i < iters; i++) {
        const expectedTick = String(i + 1);
        triggerRerender!();
        const start = performance.now();
        await waitUntil(() => {
            const el = container.querySelector('[data-tick]');
            return el?.textContent === expectedTick;
        }, 10000);
        times.push(performance.now() - start);
        await new Promise((r) => setTimeout(r, 10));
    }

    cleanup(root, container);
    times.sort((a, b) => a - b);
    return times[Math.floor(times.length / 2)];
}

// ---------------------------------------------------------------------------
// Full lifecycle: mount → fetch → resolve → render data
// ---------------------------------------------------------------------------

async function measureFullLifecycle(scenario: Scenario, n: number, iters: number): Promise<number> {
    const Wrap = scenario.Wrapper ?? React.Fragment;
    const times: number[] = [];

    for (let i = 0; i < iters; i++) {
        const start = performance.now();
        const { root, container } = renderOffscreen(
            <Wrap>
                {Array.from({ length: n }, (_, j) => <scenario.Item key={j} id={j} />)}
            </Wrap>
        );

        await waitUntil(
            () => container.querySelectorAll('[data-resolved]').length >= n,
            30000
        );

        const elapsed = performance.now() - start;
        times.push(elapsed);

        // sanity check
        const resolved = container.querySelectorAll('[data-resolved]').length;
        if (resolved !== n) {
            console.warn(`${scenario.name}: expected ${n} resolved items, got ${resolved}`);
        }

        cleanup(root, container);
        await new Promise((r) => setTimeout(r, 50));
    }

    times.sort((a, b) => a - b);
    return times[Math.floor(times.length / 2)];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function runBenchmark(
    scenarios: Scenario[],
    n: number,
    iters: number,
    onProgress: (msg: string) => void
): Promise<BenchResult[]> {
    const results: BenchResult[] = [];

    for (const s of scenarios) {
        onProgress(`${s.name}: mounting ${n}...`);
        const mountMs = await measureMount(s, n, iters);

        onProgress(`${s.name}: re-rendering ${n}...`);
        const rerenderMs = await measureRerender(s, n, iters);

        onProgress(`${s.name}: full lifecycle (${n} fetches)...`);
        const fullLifecycleMs = await measureFullLifecycle(s, n, iters);

        results.push({ name: s.name, mountMs, rerenderMs, fullLifecycleMs });
        onProgress(`${s.name}: done (${mountMs.toFixed(0)} / ${rerenderMs.toFixed(0)} / ${fullLifecycleMs.toFixed(0)})`);
    }

    return results;
}

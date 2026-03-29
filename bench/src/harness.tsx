/**
 * Benchmark harness. Renders N components offscreen, measures timings,
 * reports results. Each scenario gets the same treatment.
 */
import { createRoot } from 'react-dom/client';
import React, { useState } from 'react';

/**
 * Each scenario provides a single component that renders `n` items.
 * The component receives `n` and `uniqueKeys` and must render
 * a `<span data-resolved>` for each item once its data arrives.
 * This lets each library use its natural pattern — per-component hooks,
 * parent-owned maps, or whatever fits.
 */
export interface Scenario {
    name: string;
    /** Renders `n` items. Each resolved item must contain a <span data-resolved>. */
    Scene: React.FC<{ n: number; uniqueKeys: number }>;
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

function waitUntil(predicate: () => boolean, timeout: number, label: string, diagnostic?: () => string): Promise<void> {
    return new Promise((resolve, reject) => {
        const deadline = performance.now() + timeout;
        const check = () => {
            if (predicate()) {
                resolve();
            } else if (performance.now() > deadline) {
                const extra = diagnostic ? ` — ${diagnostic()}` : '';
                reject(new Error(`waitUntil timed out: ${label}${extra}`));
            } else {
                setTimeout(check, 1);
            }
        };
        setTimeout(check, 0);
    });
}

// ---------------------------------------------------------------------------
// Mount
// ---------------------------------------------------------------------------

async function measureMount(scenario: Scenario, n: number, uniqueKeys: number, iters: number): Promise<number> {
    const times: number[] = [];

    for (let i = 0; i < iters; i++) {
        const start = performance.now();
        const { root, container } = renderOffscreen(
            <scenario.Scene n={n} uniqueKeys={uniqueKeys} />
        );
        await waitUntil(
            () => container.querySelectorAll('span').length >= n,
            30_000,
            `${scenario.name} mount iter ${i}`,
            () => `spans: ${container.querySelectorAll('span').length}/${n}`
        );
        times.push(performance.now() - start);
        cleanup(root, container);
        await new Promise((r) => setTimeout(r, 30));
    }

    times.sort((a, b) => a - b);
    return times[Math.floor(times.length / 2)];
}

// ---------------------------------------------------------------------------
// Re-render
// ---------------------------------------------------------------------------

async function measureRerender(scenario: Scenario, n: number, uniqueKeys: number, iters: number): Promise<number> {
    let triggerRerender: (() => void) | null = null;

    function Parent() {
        const [tick, setTick] = useState(0);
        triggerRerender = () => setTick((t) => t + 1);
        return (
            <div>
                <scenario.Scene n={n} uniqueKeys={uniqueKeys} />
                <span data-tick>{tick}</span>
            </div>
        );
    }

    const { root, container } = renderOffscreen(<Parent />);
    await waitUntil(
        () => container.querySelectorAll('[data-resolved]').length >= n,
        30_000,
        `${scenario.name} rerender settle`,
        () => `resolved: ${container.querySelectorAll('[data-resolved]').length}/${n}`
    );
    await new Promise((r) => setTimeout(r, 100));

    const times: number[] = [];
    for (let i = 0; i < iters; i++) {
        const expectedTick = String(i + 1);
        triggerRerender!();
        const start = performance.now();
        await waitUntil(
            () => container.querySelector('[data-tick]')?.textContent === expectedTick,
            30_000,
            `${scenario.name} rerender iter ${i}`,
        );
        times.push(performance.now() - start);
        await new Promise((r) => setTimeout(r, 10));
    }

    cleanup(root, container);
    times.sort((a, b) => a - b);
    return times[Math.floor(times.length / 2)];
}

// ---------------------------------------------------------------------------
// Full lifecycle
// ---------------------------------------------------------------------------

async function measureFullLifecycle(scenario: Scenario, n: number, uniqueKeys: number, iters: number): Promise<number> {
    const times: number[] = [];

    for (let i = 0; i < iters; i++) {
        const start = performance.now();
        const { root, container } = renderOffscreen(
            <scenario.Scene n={n} uniqueKeys={uniqueKeys} />
        );

        await waitUntil(
            () => container.querySelectorAll('[data-resolved]').length >= n,
            30_000,
            `${scenario.name} lifecycle iter ${i}`,
            () => `resolved: ${container.querySelectorAll('[data-resolved]').length}/${n}, total spans: ${container.querySelectorAll('span').length}`
        );

        times.push(performance.now() - start);
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
    uniqueKeys: number,
    iters: number,
    onProgress: (msg: string) => void
): Promise<BenchResult[]> {
    const results: BenchResult[] = [];

    for (const s of scenarios) {
        let mountMs = -1;
        let rerenderMs = -1;
        let fullLifecycleMs = -1;

        try {
            onProgress(`${s.name}: mounting ${n}...`);
            mountMs = await measureMount(s, n, uniqueKeys, iters);
        } catch (e) {
            console.warn(`${s.name} mount failed:`, e);
            onProgress(`${s.name}: mount timed out`);
        }

        try {
            onProgress(`${s.name}: re-rendering ${n}...`);
            rerenderMs = await measureRerender(s, n, uniqueKeys, iters);
        } catch (e) {
            console.warn(`${s.name} rerender failed:`, e);
            onProgress(`${s.name}: rerender timed out`);
        }

        try {
            onProgress(`${s.name}: full lifecycle (${n} fetches)...`);
            fullLifecycleMs = await measureFullLifecycle(s, n, uniqueKeys, iters);
        } catch (e) {
            console.warn(`${s.name} lifecycle failed:`, e);
            onProgress(`${s.name}: lifecycle timed out`);
        }

        results.push({ name: s.name, mountMs, rerenderMs, fullLifecycleMs });
        onProgress(`${s.name}: done`);
    }

    return results;
}

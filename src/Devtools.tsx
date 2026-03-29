import { RemoteData } from './RemoteData';
import { RemoteDataStore } from './RemoteDataStore';
import { ReactElement, useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Store detection — duck-type check on props
// ---------------------------------------------------------------------------

function isRemoteDataStore(v: unknown): v is RemoteDataStore<unknown, unknown> {
    if (v == null || typeof v !== 'object') return false;
    const o = v as Record<string, unknown>;
    if (typeof o.triggerUpdate !== 'function') return false;
    if (typeof o.refresh !== 'function') return false;
    const current = o.current;
    if (current == null || typeof current !== 'object') return false;
    const type = (current as Record<string, unknown>).type;
    return typeof type === 'string';
}

// ---------------------------------------------------------------------------
// Fiber tree access — React internals, dev-only
// ---------------------------------------------------------------------------

function getFiberFromDOM(node: HTMLElement): any | null {
    const key = Object.keys(node).find(
        (k) => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$')
    );
    return key ? (node as any)[key] : null;
}

function findFiberRoot(fiber: any): any {
    let current = fiber;
    while (current.return) current = current.return;
    return current;
}

function getComponentName(fiber: any): string {
    if (!fiber.type) return '(unknown)';
    if (typeof fiber.type === 'string') return fiber.type;
    return fiber.type.displayName || fiber.type.name || '(anonymous)';
}

function walkFiber(root: any, visit: (fiber: any) => void): void {
    let node = root;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        visit(node);
        if (node.child) {
            node = node.child;
            continue;
        }
        while (node !== root) {
            if (node.sibling) {
                node = node.sibling;
                break;
            }
            node = node.return;
            if (!node || node === root) return;
        }
        if (node === root) return;
    }
}

// ---------------------------------------------------------------------------
// Scan
// ---------------------------------------------------------------------------

interface StoreInfo {
    id: string;
    propName: string;
    componentName: string;
    storeName: string | undefined;
    state: RemoteData<unknown, unknown>;
}

function scanTree(rootFiber: any): StoreInfo[] {
    const found: StoreInfo[] = [];
    const seen = new Set<unknown>();

    walkFiber(rootFiber, (fiber) => {
        const props = fiber.memoizedProps;
        if (!props || typeof props !== 'object') return;

        for (const [propName, value] of Object.entries(props)) {
            if (propName === 'children') continue;
            if (!isRemoteDataStore(value)) continue;
            if (seen.has(value)) continue;
            seen.add(value);

            const store = value as RemoteDataStore<unknown, unknown>;
            const componentName = getComponentName(fiber);
            found.push({
                id: `${componentName}:${store.storeName ?? propName}`,
                propName,
                componentName,
                storeName: store.storeName,
                state: store.current,
            });
        }
    });

    return found;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const stateLabel: Record<string, { symbol: string; color: string }> = {
    initial: { symbol: '○', color: '#888' },
    pending: { symbol: '◌', color: '#ff0' },
    success: { symbol: '●', color: '#0f0' },
    failed: { symbol: '✕', color: '#f55' },
    'stale-immediate': { symbol: '●', color: '#fa0' },
    'stale-initial': { symbol: '○', color: '#fa0' },
    'stale-pending': { symbol: '◌', color: '#fa0' },
};

function formatValue(state: RemoteData<unknown, unknown>): string {
    switch (state.type) {
        case 'success':
            return truncate(JSON.stringify(state.value), 60);
        case 'stale-immediate':
        case 'stale-initial':
        case 'stale-pending':
            return truncate(JSON.stringify(state.stale.value), 60);
        case 'failed':
            return state.errors.map((e) => (e.tag === 'unexpected' ? String(e.value) : JSON.stringify(e.value))).join(', ');
        default:
            return '';
    }
}

function formatAge(state: RemoteData<unknown, unknown>): string {
    let updatedAt: Date | null = null;
    if (state.type === 'success') updatedAt = state.updatedAt;
    else if (state.type === 'stale-immediate' || state.type === 'stale-initial' || state.type === 'stale-pending')
        updatedAt = state.stale.updatedAt;

    if (!updatedAt) return '';
    const ms = Date.now() - updatedAt.getTime();
    if (ms < 1000) return `${ms}ms ago`;
    if (ms < 60_000) return `${(ms / 1000).toFixed(0)}s ago`;
    return `${(ms / 60_000).toFixed(0)}m ago`;
}

function truncate(s: string, max: number): string {
    return s.length > max ? s.slice(0, max - 1) + '\u2026' : s;
}

/**
 * Dev-only panel that scans the React fiber tree for RemoteDataStore
 * instances in component props and displays their current state.
 *
 * Drop it anywhere in your app during development:
 *
 * ```tsx
 * {process.env.NODE_ENV === 'development' && <RemoteDataDevtools />}
 * ```
 *
 * Must be rendered in the same React root as the stores you want to inspect.
 */
export function RemoteDataDevtools({
    pollInterval,
    position,
}: {
    pollInterval?: number;
    position?: 'bottom-right' | 'bottom-left';
}): ReactElement {
    const containerRef = useRef<HTMLDivElement>(null);
    const [stores, setStores] = useState<StoreInfo[]>([]);
    const [collapsed, setCollapsed] = useState(false);
    const interval = pollInterval ?? 1000;
    const pos = position ?? 'bottom-right';

    useEffect(() => {
        const scan = () => {
            if (!containerRef.current) return;
            const fiber = getFiberFromDOM(containerRef.current);
            if (!fiber) return;
            const root = findFiberRoot(fiber);
            setStores(scanTree(root));
        };

        scan();
        const handle = setInterval(scan, interval);
        return () => clearInterval(handle);
    }, [interval]);

    const posStyle =
        pos === 'bottom-right' ? { bottom: 8, right: 8 } : { bottom: 8, left: 8 };

    return (
        <div
            ref={containerRef}
            style={{
                position: 'fixed',
                ...posStyle,
                zIndex: 99999,
                fontFamily: 'ui-monospace, monospace',
                fontSize: 12,
                background: '#1a1a1a',
                color: '#eee',
                border: '1px solid #333',
                borderRadius: 6,
                minWidth: collapsed ? 0 : 320,
                maxHeight: '50vh',
                overflow: 'auto',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}
        >
            <div
                onClick={() => setCollapsed((c) => !c)}
                style={{
                    padding: '6px 10px',
                    background: '#222',
                    cursor: 'pointer',
                    borderBottom: collapsed ? 'none' : '1px solid #333',
                    display: 'flex',
                    justifyContent: 'space-between',
                    userSelect: 'none',
                }}
            >
                <span>use-remote-data</span>
                <span style={{ color: '#888' }}>
                    {stores.length} store{stores.length !== 1 ? 's' : ''}{' '}
                    {collapsed ? '▸' : '▾'}
                </span>
            </div>
            {!collapsed && (
                <div style={{ padding: '4px 0' }}>
                    {stores.length === 0 && (
                        <div style={{ padding: '8px 10px', color: '#666' }}>No stores found</div>
                    )}
                    {stores.map((s) => {
                        const { symbol, color } = stateLabel[s.state.type] ?? {
                            symbol: '?',
                            color: '#888',
                        };
                        const value = formatValue(s.state);
                        const age = formatAge(s.state);
                        return (
                            <div
                                key={s.id}
                                style={{
                                    padding: '3px 10px',
                                    borderBottom: '1px solid #222',
                                }}
                            >
                                <div>
                                    <span style={{ color, marginRight: 6 }}>{symbol}</span>
                                    <span style={{ color: '#adf' }}>
                                        {s.storeName ?? s.propName}
                                    </span>
                                    <span style={{ color: '#666', marginLeft: 8 }}>
                                        {s.state.type}
                                    </span>
                                    {age && (
                                        <span style={{ color: '#666', marginLeft: 8 }}>
                                            {age}
                                        </span>
                                    )}
                                </div>
                                {value && (
                                    <div style={{ color: '#999', marginLeft: 16, marginTop: 1 }}>
                                        {value}
                                    </div>
                                )}
                                <div style={{ color: '#555', marginLeft: 16 }}>
                                    {s.componentName}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

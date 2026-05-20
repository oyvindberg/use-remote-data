import styles from './index.module.css';
import Link from '@docusaurus/Link';
import { useColorMode } from '@docusaurus/theme-common';
import Layout from '@theme/Layout';
import { Highlight } from 'prism-react-renderer';
import React from 'react';

// Light Prism theme — dark text on bright background, orange keywords.
const lightTheme = {
    plain: { color: '#0a0a0a', backgroundColor: 'transparent' },
    styles: [
        { types: ['comment', 'prolog', 'doctype', 'cdata'], style: { color: '#a3a3a3', fontStyle: 'italic' } },
        { types: ['punctuation', 'operator'], style: { color: '#737373' } },
        { types: ['namespace'], style: { opacity: 0.7 } },
        { types: ['string', 'attr-value'], style: { color: '#9a3412' } },
        { types: ['number', 'boolean'], style: { color: '#c2410c' } },
        { types: ['keyword', 'atrule'], style: { color: '#ea580c', fontWeight: '600' } },
        { types: ['function', 'class-name', 'maybe-class-name'], style: { color: '#0a0a0a', fontWeight: '600' } },
        { types: ['tag'], style: { color: '#ea580c' } },
        { types: ['attr-name'], style: { color: '#9a3412' } },
        { types: ['property-access', 'property'], style: { color: '#0a0a0a' } },
        { types: ['variable', 'parameter', 'plain'], style: { color: '#0a0a0a' } },
        { types: ['constant', 'symbol'], style: { color: '#c2410c' } },
        { types: ['regex', 'important'], style: { color: '#9a3412' } },
        { types: ['inserted'], style: { color: '#15803d' } },
        { types: ['deleted'], style: { color: '#b91c1c' } },
    ],
};

// Dark Prism theme — light text on near-black background, orange keywords.
const darkTheme = {
    plain: { color: '#e5e5e5', backgroundColor: 'transparent' },
    styles: [
        { types: ['comment', 'prolog', 'doctype', 'cdata'], style: { color: '#737373', fontStyle: 'italic' } },
        { types: ['punctuation', 'operator'], style: { color: '#a3a3a3' } },
        { types: ['namespace'], style: { opacity: 0.7 } },
        { types: ['string', 'attr-value'], style: { color: '#fcd9b6' } },
        { types: ['number', 'boolean'], style: { color: '#fb923c' } },
        { types: ['keyword', 'atrule'], style: { color: '#fb923c', fontWeight: '600' } },
        { types: ['function', 'class-name', 'maybe-class-name'], style: { color: '#fafafa', fontWeight: '500' } },
        { types: ['tag'], style: { color: '#fb923c' } },
        { types: ['attr-name'], style: { color: '#fcd9b6' } },
        { types: ['property-access', 'property'], style: { color: '#e5e5e5' } },
        { types: ['variable', 'parameter', 'plain'], style: { color: '#e5e5e5' } },
        { types: ['constant', 'symbol'], style: { color: '#fb923c' } },
        { types: ['regex', 'important'], style: { color: '#fcd9b6' } },
        { types: ['inserted'], style: { color: '#86efac' } },
        { types: ['deleted'], style: { color: '#fca5a5' } },
    ],
};

function Code({ code, language }) {
    const { colorMode } = useColorMode();
    const theme = colorMode === 'dark' ? darkTheme : lightTheme;
    return (
        <div className={styles.codeBlock}>
            <Highlight theme={theme} code={code.trim()} language={language || 'tsx'}>
                {({ style, tokens, getLineProps, getTokenProps }) => (
                    <pre style={{ ...style, background: 'transparent' }}>
                        {tokens.map((line, i) => (
                            <div key={i} {...getLineProps({ line })}>
                                {line.map((token, key) => (
                                    <span key={key} {...getTokenProps({ token })} />
                                ))}
                            </div>
                        ))}
                    </pre>
                )}
            </Highlight>
        </div>
    );
}

const codeBefore = `
function UserProfile({ id }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchUser(id)
      .then(setUser)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;
  if (error) return <p>Something broke</p>;

  return <h1>{user.name}</h1>;
  // user is User | null. Oops.
}`;

const codeAfter = `
function UserProfile({ id }) {
  const userStore = useRemoteData(
    () => fetchUser(id), { dependencies: [id] }
  );

  return (
    <Await store={userStore}>
      {(user) => <h1>{user.name}</h1>}
      {/* user is User. Always. */}
    </Await>
  );
}`;

const codeAwait = `
<Await store={userStore}>
  {(user) => (
    // user is User. Never undefined,
    // never null, never loading.
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  )}
</Await>`;

const codeError = `
<Await store={userStore}
  error={({ errors, retry }) => (
    <div>
      <p>Something went wrong.</p>
      <button onClick={retry}>Try again</button>
    </div>
  )}
>
  {(user) => <h1>{user.name}</h1>}
</Await>`;

const codeRetry = `
// Combine three stores. One fails.
const allStore = RemoteDataStore.all(
  userStore, postsStore, statsStore
);

// retry() only re-fetches the broken one.
// The two successful stores keep their data.
<Await store={allStore}
  error={({ retry }) => (
    <button onClick={retry}>Retry failed</button>
  )}
>
  {([user, posts, stats]) => <Dashboard ... />}
</Await>`;

const codeRefresh = `
const store = useRemoteData(
  () => fetchPrices(), {
    refresh: RefreshStrategy.afterMillis(30_000),
  }
);

// isStale: true while background
// refresh is in progress, old data stays visible
<Await store={store}>
  {(prices, isStale) => (
    <div style={{ opacity: isStale ? 0.6 : 1 }}>
      <PriceTable prices={prices} />
    </div>
  )}
</Await>`;

const codeMutationRefresh = `
const todosStore = useRemoteData(() => fetchTodos());

const addTodo = useRemoteUpdate(
  (text) => api.addTodo(text), {
    refreshes: [todosStore],
  }
);

// addTodo.run("Buy milk")
//   → mutation fires
//   → on success, todosStore re-fetches
//   → Await re-renders with fresh data`;

const codeCombine = `
const userStore  = useRemoteData(() => fetchUser(id),  { dependencies: [id] });
const postsStore = useRemoteData(() => fetchPosts(id), { dependencies: [id] });
const statsStore = useRemoteData(() => fetchStats(id), { dependencies: [id] });

const allStore = RemoteDataStore.all(
  userStore, postsStore, statsStore
);

return (
  <Await store={allStore}>
    {([user, posts, stats]) => (
      <Dashboard user={user} posts={posts} stats={stats} />
    )}
  </Await>
);`;

const codeTesting = `
import { RemoteData, RemoteDataStore, Failure } from "use-remote-data";

// A store that's already loaded. No fetch, no mock.
const store = RemoteDataStore.of(
  RemoteData.success({ name: "Alice", email: "alice@ex.com" })
);

render(<UserCard store={store} />);
expect(screen.getByText("Alice")).toBeInTheDocument();

// Test loading? Errors? Same idea.
const loading = RemoteDataStore.of(RemoteData.Pending);
const failed  = RemoteDataStore.of(
  RemoteData.Failed(
    [Failure.unexpected(new Error("timeout"))],
    async () => {}
  )
);`;

const codeLifetime = `
function UserPage({ id }) {
  // Store created when UserPage mounts.
  // Fetches on first render. Caches while mounted.
  // Unmount UserPage: store is gone. No stale cache.
  const userStore = useRemoteData(
    () => fetchUser(id), { dependencies: [id] }
  );

  // Pass the store down. Child components
  // share the same fetch, same cache.
  return (
    <Layout>
      <UserHeader store={userStore} />
      <UserPosts store={userStore} />
    </Layout>
  );
}`;

const quickHits = [
    {
        title: 'Zero dependencies',
        text: 'Just React. ~3.5kB gzipped, no runtime deps, no context providers, no bloat.',
    },
    {
        title: 'SSR ready',
        text: 'Pass server data as initial. The store starts in Success. No hydration boundaries to wire up.',
    },
    {
        title: 'Automatic cancellation',
        text: 'When deps change or a component unmounts, in-flight requests are aborted. Stale responses are always discarded.',
    },
    {
        title: 'Lazy by default',
        text: 'Stores only fetch when rendered. Define data dependencies upfront; only what mounts hits the network.',
    },
    {
        title: 'Mutations that refresh',
        text: 'First-class writes with useRemoteUpdate. After a successful mutation, dependent stores re-fetch automatically.',
    },
    {
        title: 'Typed errors',
        text: 'Separate domain errors from crashes. Validate with Zod, handle GraphQL unions; TypeScript knows which error you have.',
    },
];

function Section({ label, title, text, code, alt, reverse }) {
    return (
        <section className={`${styles.section} ${alt ? styles.sectionAlt : ''}`}>
            <div className={reverse ? styles.sectionInnerReverse : styles.sectionInner}>
                <div>
                    <span className={styles.sectionLabel}>{label}</span>
                    <h2 className={styles.sectionTitle}>{title}</h2>
                    <p className={styles.sectionText}>{text}</p>
                </div>
                <Code code={code} />
            </div>
        </section>
    );
}

export default function Home() {
    return (
        <Layout description="A React hook for async data. Loading, error, success: always one state, always type-safe.">
            <div className={styles.page}>
                {/* ── Hero ─────────────────────────────────── */}
                <header className={styles.hero}>
                    <div className={styles.heroInner}>
                        <h1 className={`${styles.heroHeadline} ${styles.reveal} ${styles.r1}`}>
                            <span className={styles.heroLine}>Async data.</span>
                            <span className={styles.heroLine}>
                                <mark>Zero</mark> guesswork.
                            </span>
                        </h1>

                        <p className={`${styles.heroSubtitle} ${styles.reveal} ${styles.r2}`}>
                            A React hook with one promise: inside <code>{'<Await>'}</code> your data is <code>T</code>,
                            never <code>T | undefined</code>. Loading, error, success — always one state, always
                            type-safe.
                        </p>

                        <div className={`${styles.heroCta} ${styles.reveal} ${styles.r3}`}>
                            <Link className={styles.ctaButton} to="/docs/getting-started">
                                Read the docs →
                            </Link>
                            <span className={styles.installCmd}>npm install use-remote-data</span>
                        </div>
                    </div>
                </header>

                {/* ── Before / After ───────────────────────── */}
                <section className={styles.comparison}>
                    <div className={styles.comparisonInner}>
                        <div className={styles.comparisonPane}>
                            <span className={`${styles.comparisonLabel} ${styles.labelBefore}`}>The old way</span>
                            <Code code={codeBefore} />
                        </div>
                        <div className={`${styles.comparisonPane} ${styles.after}`}>
                            <span className={`${styles.comparisonLabel} ${styles.labelAfter}`}>use-remote-data</span>
                            <Code code={codeAfter} />
                        </div>
                    </div>
                </section>

                <main>
                    <Section
                        label="01 / type narrowing"
                        title="Inside Await, data is never undefined."
                        text="The Await component narrows the type. Inside the callback, your data is the success type. No null checks, no optional chaining, no guessing."
                        code={codeAwait}
                    />

                    <Section
                        label="02 / failures"
                        title="Errors are data, not exceptions."
                        text="When a request fails, the store moves to the Failed state, with the error and a retry callback. No try/catch. No error boundaries. Just a render prop."
                        code={codeError}
                        alt
                        reverse
                    />

                    <Section
                        label="03 / composition"
                        title="Three API calls. One typed tuple."
                        text="Combine multiple stores into one with RemoteDataStore.all(). Lazy, type-safe, with automatic retry."
                        code={codeCombine}
                    />

                    <Section
                        label="04 / surgical retry"
                        title="Retry only what broke."
                        text="When you combine three stores and one fails, retry() only re-fetches the failed request. The two successful stores keep their data. One button, one re-fetch."
                        code={codeRetry}
                        alt
                        reverse
                    />

                    <Section
                        label="05 / freshness"
                        title="Data stays fresh without a flicker."
                        text="Tell the store how long data should live. It re-fetches in the background when data goes stale, so your users keep seeing the old data while the new data loads."
                        code={codeRefresh}
                    />

                    <Section
                        label="06 / writes"
                        title="Mutations refresh reads."
                        text="After a successful write, the stores you depend on re-fetch automatically. No manual cache busting. Declare what should refresh and it happens."
                        code={codeMutationRefresh}
                        alt
                        reverse
                    />

                    <Section
                        label="07 / testing"
                        title="Test without mocking."
                        text="Stores are values. Pass one to your component and assert what renders. RemoteDataStore.of() creates a store in any state. The same approach works for Storybook."
                        code={codeTesting}
                    />

                    <Section
                        label="08 / lifetime"
                        title="Data lifetime follows the component tree."
                        text="Stores live in components, not in a global cache. Mount a page, its data fetches. Unmount, it's gone. Pass a store as a prop and every child shares the same fetch."
                        code={codeLifetime}
                        alt
                        reverse
                    />

                    {/* ── Everything else ─────────────────── */}
                    <section className={styles.gridSection}>
                        <div className={styles.gridInner}>
                            <span className={styles.gridLabel}>09 / further notes</span>
                            <h2 className={styles.gridTitle}>Six things you also get.</h2>

                            <div className={styles.grid}>
                                {quickHits.map((item, i) => (
                                    <div key={item.title} className={styles.gridItem}>
                                        <span className={styles.gridItemNumber}>{String(i + 1).padStart(2, '0')}</span>
                                        <h3>{item.title}</h3>
                                        <p>{item.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </Layout>
    );
}

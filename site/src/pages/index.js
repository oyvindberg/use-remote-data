import styles from './index.module.css';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import { Highlight, themes } from 'prism-react-renderer';
import React from 'react';

function Code({ code, language }) {
    return (
        <div className={styles.codeBlock}>
            <Highlight theme={themes.dracula} code={code.trim()} language={language || 'tsx'}>
                {({ style, tokens, getLineProps, getTokenProps }) => (
                    <pre style={style}>
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
    // user is User — never undefined,
    // never null, never loading.
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  )}
</Await>`;

const codeInstall = `
import { useRemoteData, Await } from "use-remote-data";

function UserProfile({ id }) {
  const store = useRemoteData(
    () => fetch(\`/api/users/\${id}\`).then(r => r.json()),
    { dependencies: [id] }
  );

  return (
    <Await store={store}
      loading={() => <Spinner />}
    >
      {(user) => <h1>{user.name}</h1>}
    </Await>
  );
}`;

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
// When you combine three stores and one fails:
const allStore = RemoteDataStore.all(
  userStore, postsStore, statsStore
);

// The combined store moves to "failed".
// But retry() only re-fetches the broken one.
// The two successful stores keep their data.
//
// One button. One click. Surgical retry.
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
    // Re-fetch every 30 seconds
    refresh: RefreshStrategy.afterMillis(30_000),
  }
);

// isStale is true while background
// refresh is in progress — old data stays visible
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
    // After a successful mutation,
    // automatically re-fetch the todo list
    refreshes: [todosStore],
  }
);

// addTodo.run("Buy milk")
// → mutation fires
// → on success, todosStore re-fetches
// → Await re-renders with fresh data`;

const codeCombine = `
const userStore = useRemoteData(() => fetchUser(id), { dependencies: [id] });
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

// A store that's already loaded — no fetch, no mock
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
  // Store is created when UserPage mounts.
  // Fetches on first render. Caches while mounted.
  // Unmount UserPage → store is gone. No stale cache.
  const userStore = useRemoteData(
    () => fetchUser(id), { dependencies: [id] }
  );

  // Pass the store down — child components
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
        title: 'Zero dependencies, ~3.5kB gzipped',
        text: 'Just React. No runtime dependencies, no context providers, no bloat.',
    },
    { title: 'SSR ready', text: 'Pass server data as initial. No hydration boundaries.' },
    {
        title: 'Automatic cancellation',
        text: 'When deps change or a component unmounts, in-flight requests are aborted. Stale responses are always discarded.',
    },
    {
        title: 'Lazy by default',
        text: 'Stores only fetch when rendered. Define data dependencies upfront — only what mounts hits the network.',
    },
    {
        title: 'Mutations that refresh',
        text: 'First-class writes with useRemoteUpdate. After a successful mutation, dependent stores re-fetch automatically.',
    },
    {
        title: 'Typed errors',
        text: 'Separate domain errors from crashes. Validate with Zod, handle GraphQL unions — TypeScript knows which error you have.',
    },
];

function Section({ title, text, code, alt, reverse }) {
    const textBlock = (
        <div>
            <h2 className={styles.sectionTitle}>{title}</h2>
            <p className={styles.sectionText}>{text}</p>
        </div>
    );
    const codeBlock = <Code code={code} />;

    return (
        <section className={`${styles.section} ${alt ? styles.sectionAlt : ''}`}>
            <div className={reverse ? styles.sectionInnerReverse : styles.sectionInner}>
                {textBlock}
                {codeBlock}
            </div>
        </section>
    );
}

export default function Home() {
    return (
        <Layout description="A React hook for async data. Loading, error, success — always one state, always type-safe.">
            {/* Hero */}
            <header className={styles.hero}>
                <div className={styles.heroInner}>
                    <h1 className={styles.heroHeadline}>Fetch data in React without the boilerplate.</h1>
                    <p className={styles.heroSubtitle}>
                        One hook. One component. Your data is <code>T</code>, not <code>T&nbsp;|&nbsp;undefined</code>.
                        <br />
                        Loading, error, success — always one state, always type-safe.
                    </p>
                    <div className={styles.heroCta}>
                        <Link className={styles.ctaButton} to="/docs/getting-started">
                            Get Started
                        </Link>
                        <a
                            className={styles.githubLink}
                            href="https://github.com/oyvindberg/use-remote-data"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            View on GitHub &rarr;
                        </a>
                    </div>
                    <div className={styles.comparison}>
                        <div className={styles.comparisonPane}>
                            <span className={`${styles.comparisonLabel} ${styles.labelBefore}`}>The old way</span>
                            <Code code={codeBefore} />
                        </div>
                        <div className={styles.comparisonPane}>
                            <span className={`${styles.comparisonLabel} ${styles.labelAfter}`}>use-remote-data</span>
                            <Code code={codeAfter} />
                        </div>
                    </div>
                </div>
            </header>

            <main>
                {/* Section 2 */}
                <Section
                    title="Inside Await, your data is never undefined."
                    text="The Await component narrows the type. Inside the callback, your data is the success type — no null checks, no optional chaining, no guessing."
                    code={codeAwait}
                />

                {/* Section 3 */}
                <Section
                    title="Install. Import. Done."
                    text="No providers, no context, no config. One hook gives you a store. One component renders it. That's the entire API."
                    code={codeInstall}
                    alt
                    reverse
                />

                {/* Section 4: Error handling */}
                <Section
                    title="Errors are data, not exceptions."
                    text="When a request fails, the store moves to the Failed state — with the error and a retry callback. No try/catch. No error boundaries. No manual error state. Just a render prop."
                    code={codeError}
                />

                {/* Section 5: Surgical retry */}
                <Section
                    title="Retry only what broke."
                    text="When you combine three stores and one fails, retry() only re-fetches the failed request. The two successful stores keep their data. One button, surgical precision."
                    code={codeRetry}
                    alt
                    reverse
                />

                {/* Combine */}
                <Section
                    title="Three API calls. One typed tuple."
                    text="Combine multiple stores into one with RemoteDataStore.all(). Still lazy, still type-safe, still with automatic retry."
                    code={codeCombine}
                />

                {/* Invalidation */}
                <Section
                    title="Data stays fresh automatically."
                    text="Tell the store how long data should live. It re-fetches in the background when data goes stale — your users keep seeing the old data while the new data loads. No spinners, no flicker."
                    code={codeRefresh}
                    alt
                    reverse
                />

                {/* Mutation invalidation */}
                <Section
                    title="Mutations refresh reads."
                    text="After a successful write, the stores you depend on re-fetch automatically. No manual cache busting. No imperative refetch calls. Just declare what should refresh and it happens."
                    code={codeMutationRefresh}
                />

                {/* Testing */}
                <Section
                    title="Test without mocking."
                    text="Stores are values. Pass one to your component and assert what renders — no mock servers, no providers, no async coordination. RemoteDataStore.of() creates a store in any state you want. The same approach works for Storybook."
                    code={codeTesting}
                    alt
                    reverse
                />

                {/* Lifetime */}
                <Section
                    title="Data lifetime follows component hierarchy."
                    text="Stores live in components, not in a global cache. Mount a page — its data fetches. Unmount — it's gone. No manual cache invalidation, no stale entries leaking across routes. Pass a store as a prop and every child shares the same fetch."
                    code={codeLifetime}
                    alt
                    reverse
                />

                {/* Quick hits */}
                <section className={styles.gridSection}>
                    <div className={styles.gridInner}>
                        <h2 className={styles.gridTitle}>Everything else you need</h2>
                        <div className={styles.grid}>
                            {quickHits.map((item) => (
                                <div key={item.title} className={styles.gridItem}>
                                    <h3>{item.title}</h3>
                                    <p>{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Bottom CTA */}
                <section className={styles.bottomCta}>
                    <h2 className={styles.bottomCtaHeadline}>Stop guessing.</h2>
                    <div className={styles.bottomCtaActions}>
                        <Link className={styles.ctaButton} to="/docs/getting-started">
                            Get Started
                        </Link>
                        <span className={styles.installCmd}>npm install use-remote-data</span>
                    </div>
                </section>
            </main>
        </Layout>
    );
}

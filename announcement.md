Every React app fetches data. Most get the types wrong.

You know the pattern: `const { data, isLoading, error } = ...` where `data` is `T | undefined` and you just
_hope_ you checked `isLoading` before rendering. TypeScript can't save you. It's honor-system type safety.

`use-remote-data` takes a different approach. Your data is always in exactly one state — loading, failed, or
succeeded — and you **cannot access the value without proving it exists**. No `data!`, no `if (data)`, no
`T | undefined`. Inside the render callback, your data is `T`. Period.

```tsx
const store = useRemoteData(() => fetch('/api/user').then((r) => r.json()));

<Await store={store}>
    {(user) => <span>{user.name}</span>} {/* user is User, not User | undefined */}
</Await>;
```

That's the basic idea. On top of it, you get:

- **Invalidation** — tell the store how long data should live. It re-fetches in the background while your users keep seeing the old data. No spinners for stale refreshes.
- **Retry** — when a request fails, retry is built right into the state. One click, only the failed request re-fires.
- **Compose** — need three API calls before you can render? `RemoteDataStore.all(a, b, c)` gives you a typed tuple. One combined store. All the same guarantees.
- **Mutations** — `useRemoteUpdate` gives writes the same principled treatment as reads. Auto-invalidate dependent stores after a successful mutation.
- **Lazy** — stores don't fetch until they're rendered. Define them high in your tree, pass them down, and only the ones that actually mount will fire.
- **Zero dependencies** — just React. No context providers, no global cache, no configuration.

If you've ever used the RemoteData pattern from Elm or fp-ts, this will feel familiar.
If you haven't, the [docs](https://oyvindberg.github.io/use-remote-data/) have runnable examples for everything.

Would love any feedback — especially from people who try it in a real project.

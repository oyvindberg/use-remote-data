# use-remote-data

A React hook for async data. Loading, error, success: always one state, always type-safe.

```tsx
const store = useRemoteData(() => fetchUser(id));

<Await store={store}>{(user) => <span>{user.name}</span>}</Await>;
```

Inside the callback, `user` is `User`, not `User | undefined`. You cannot read the value without proving it exists.

Refresh, retry, mutations, lazy loading, typed errors, composing requests; all in one tiny library with zero dependencies beyond React.

**[Read the docs](https://oyvindberg.github.io/use-remote-data/)**

### Prior art

Based on the Remote Data pattern: https://medium.com/@gcanti/slaying-a-ui-antipattern-with-flow-5eed0cfb627b

Related: [remote-data-ts](https://github.com/devexperts/remote-data-ts), [remote-data](https://github.com/mcollis/remote-data), [react-remote-data-hooks](https://github.com/skkallayath/react-remote-data-hooks)

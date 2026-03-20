# use-remote-data

Async data for React, without the guesswork.

Your data is always in exactly one state — loading, failed, or succeeded — and you
**cannot access the value without proving it exists**. No `T | undefined`. No boolean flags. No guessing.

```tsx
const store = useRemoteData(() => fetchUser(id));

<Await store={store}>{(user) => <span>{user.name}</span>}</Await>;
```

Inside the callback, `user` is `User`. Not `User | undefined`. TypeScript enforces it.

On top of this, you get automatic refresh, retry, composing multiple requests, mutations, lazy loading, and typed errors — all with zero dependencies beyond React.

**[Read the docs](https://oyvindberg.github.io/use-remote-data/)**

### Prior art

Based on the Remote Data pattern described in:

- https://medium.com/@gcanti/slaying-a-ui-antipattern-with-flow-5eed0cfb627b

Related libraries:

- https://github.com/devexperts/remote-data-ts
- https://github.com/mcollis/remote-data
- https://github.com/skkallayath/react-remote-data-hooks

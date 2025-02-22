# Awesome data access for React

Start with the [documentation](https://oyvindberg.github.io/use-remote-data/)

### Some background

Based on the pattern described in this article:

- https://medium.com/@gcanti/slaying-a-ui-antipattern-with-flow-5eed0cfb627b

Through react hooks and the `RemoteDataStore` abstraction on top of `RemoteData`, this library also provides:

- lazy loading - only data which is necessary to render is fetched
- invalidation - you specify how long the data should live, and it'll be automatically updated
- sharing references to stores between components and deduplicating fetches
- retrying failed fetches

### prior art

- https://github.com/devexperts/remote-data-ts
- https://github.com/mcollis/remote-data
- https://github.com/skkallayath/react-remote-data-hooks
- https://github.com/devexperts/remote-data-ts

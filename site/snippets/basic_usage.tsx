// all examples use these imports
import * as React from "react";
import { RemoteData, RemoteDataStore, useRemoteData, WithRemoteData } from "use-remote-data";

// we'll use this example throughout. obviously you would typically call an API
function produce<T>(value: T, delay: number = 1000): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), delay));
}

export const Component: React.FC = () => {
  const computeOne: RemoteDataStore<number> =
    useRemoteData(() => produce(1));

  return <WithRemoteData store={computeOne}>
      {(num: number) => <span>{num}</span>}
    </WithRemoteData>;
};

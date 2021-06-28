import * as React from 'react';
import { RemoteDataStore, useRemoteData, WithRemoteData } from 'use-remote-data';

var i = 0;
const freshData = (): Promise<number> =>
    new Promise((resolve) => {
        i += 1;
        setTimeout(() => resolve(i), 1000);
    });

var j = 0;
const failSometimes = (): Promise<number> =>
    new Promise((resolve, reject) => {
        j += 1;
        if (j % 10 === 0) reject(`${j} was dividable by 10`);
        else resolve(j);
    });

export const Component: React.FC = () => {
    const one = useRemoteData(freshData, { ttlMillis: 1000 });
    const two = useRemoteData(failSometimes, { ttlMillis: 100 });

    return <WithRemoteData store={RemoteDataStore.all(one, two)}>
            {([num1, num2]) => <span>{num1} - {num2}</span>}
        </WithRemoteData>;
};

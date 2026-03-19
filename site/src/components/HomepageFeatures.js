import styles from './HomepageFeatures.module.css';
import clsx from 'clsx';
import React from 'react';

const FeatureList = [
    {
        title: 'Your data is always in one of these states',
        Svg: require('../../static/img/undraw_docusaurus_mountain.svg').default,
        description: (
            <>
                Loading. Failed. Succeeded. Stale. <code>use-remote-data</code> makes every state explicit and
                impossible to forget. No more <code>if (data)</code> guesswork.
            </>
        ),
    },
    {
        title: 'Data stays fresh automatically',
        Svg: require('../../static/img/undraw_docusaurus_tree.svg').default,
        description: (
            <>
                Tell the store how long data should live. It re-fetches in the background when it goes stale — your
                users keep seeing the old data while the new data loads.
            </>
        ),
    },
    {
        title: 'Only fetch what you render',
        Svg: require('../../static/img/undraw_docusaurus_tree.svg').default,
        description: (
            <>
                Stores are lazy. Define ten data sources at the top of your tree, pass them down as props — only the
                ones that actually render will fire a request.
            </>
        ),
    },
    {
        title: 'Errors and retries, handled',
        Svg: require('../../static/img/undraw_docusaurus_tree.svg').default,
        description: (
            <>
                When a request fails, a retry callback is right there in the state. One click and only the failed
                request re-fires. No boilerplate.
            </>
        ),
    },
    {
        title: 'Compose everything',
        Svg: require('../../static/img/undraw_docusaurus_tree.svg').default,
        description: (
            <>
                Need three API calls before you can render? Combine them into one store with{' '}
                <code>RemoteDataStore.all()</code>. Still lazy, still type-safe, still with retry.
            </>
        ),
    },
    {
        title: 'Zero dependencies',
        Svg: require('../../static/img/undraw_docusaurus_react.svg').default,
        description: (
            <>
                Just React. No runtime dependencies, no context providers to set up, no global cache to configure.
                Install and go.
            </>
        ),
    },
];

function Feature({ Svg, title, description }) {
    return (
        <div className={clsx('col col--4')}>
            <div className="text--center">
                <Svg className={styles.featureSvg} alt={title} />
            </div>
            <div className="text--center padding-horiz--md">
                <h3>{title}</h3>
                <p>{description}</p>
            </div>
        </div>
    );
}

export default function HomepageFeatures() {
    return (
        <section className={styles.features}>
            <div className="container">
                <div className="row">
                    {FeatureList.map((props, idx) => (
                        <Feature key={idx} {...props} />
                    ))}
                </div>
            </div>
        </section>
    );
}

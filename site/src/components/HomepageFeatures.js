import React from 'react';
import clsx from 'clsx';
import styles from './HomepageFeatures.module.css';

const FeatureList = [
    {
        title: 'Remote Data pattern',
        Svg: require('../../static/img/undraw_docusaurus_mountain.svg').default,
        description: (
            <>
                Known from Elm and elsewhere, the Remote Data pattern models the different states of a data request in a
                principled manner.
            </>
        ),
    },
    {
        title: 'Invalidation',
        Svg: require('../../static/img/undraw_docusaurus_tree.svg').default,
        description: <>Need warm data? No problem, just say how long you want it to be valid</>,
    },
    {
        title: 'Lazy',
        Svg: require('../../static/img/undraw_docusaurus_tree.svg').default,
        description: <>Declare all you data sources, and fetch only those needed to render.</>,
    },
    {
        title: 'Error handling',
        Svg: require('../../static/img/undraw_docusaurus_tree.svg').default,
        description: <>Graceful handling, with retry functionality out of the box.</>,
    },
    {
        title: 'Composable',
        Svg: require('../../static/img/undraw_docusaurus_tree.svg').default,
        description: (
            <>
                One request? Ten requests? Fetch them all at once. Still lazy, still invalidating, still with error
                handling and retry.
            </>
        ),
    },
    {
        title: 'Powered by React',
        Svg: require('../../static/img/undraw_docusaurus_react.svg').default,
        description: (
            <>
                <code>use-remote-data</code> is built only on react hooks and has no other dependencies.
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

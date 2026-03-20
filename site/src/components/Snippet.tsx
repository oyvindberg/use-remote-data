import Link from '@docusaurus/Link';
import CodeBlock from '@theme/CodeBlock';
import React, { FC } from 'react';

type Props = {
    snippet: string;
};

// Webpack context for snippet modules — used to bust the cache on re-run
const snippetContext = require.context('../../snippets', false, /\.tsx$/);

function loadSnippet(snippet: string) {
    const key = `./${snippet}.tsx`;
    return snippetContext(key) as { Component: FC };
}

function resetSnippet(snippet: string) {
    // Delete the cached module so the next require re-evaluates it,
    // resetting any module-level mutable state (counters, Maps, etc.)
    const key = `./${snippet}.tsx`;
    const moduleId = snippetContext.resolve(key);
    // @ts-expect-error — accessing webpack's internal module cache
    const cache = __webpack_require__.c;
    if (cache && cache[moduleId]) {
        delete cache[moduleId];
    }
}

export const Snippet: FC<Props> = ({ snippet }) => {
    const text: string = require(`!raw-loader!../../snippets/${snippet}.tsx`).default as any;
    const [i, setI] = React.useState(0);
    const [Component, setComponent] = React.useState<FC | null>(null);

    const handleRun = () => {
        resetSnippet(snippet);
        const mod = loadSnippet(snippet);
        setComponent(() => mod.Component);
        setI(i + 1);
    };

    return (
        <div>
            <CodeBlock language="tsx">{text}</CodeBlock>

            <div>
                <div>
                    <Link className="button button--secondary button--sm" onClick={handleRun}>
                        {i === 0 ? 'Run snippet' : 'Run again'}
                    </Link>
                </div>
                {i > 0 && Component && (
                    <div style={{ padding: '1em', margin: '1em', backgroundColor: '#b8e092', color: 'black' }}>
                        <Component key={i} />
                    </div>
                )}
            </div>
            <br />
        </div>
    );
};

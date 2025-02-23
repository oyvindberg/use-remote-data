import Link from '@docusaurus/Link';
import React, { FC } from 'react';
import CodeBlock from '@theme/CodeBlock';

type Props = {
    snippet: string;
};

export const Snippet: FC<Props> = ({ snippet }) => {
    const text: string = require(`!raw-loader!../../snippets/${snippet}.tsx`).default as any;
    const { Component } = require(`../../snippets/${snippet}`);
    const [i, setI] = React.useState(0);

    return (
        <div>
            <CodeBlock language="tsx">{text}</CodeBlock>

            <div>
                <div>
                    <Link className="button button--secondary button--sm" onClick={() => setI(i + 1)}>
                        {i === 0 ? 'Run snippet' : 'Run again'}
                    </Link>
                </div>
                {i > 0 && (
                    <div style={{ padding: '1em', margin: '1em', backgroundColor: '#b8e092', color: 'black' }}>
                        <Component key={i} />
                    </div>
                )}
            </div>
            <br />
        </div>
    );
};

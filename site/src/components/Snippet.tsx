import React from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import Link from '@docusaurus/Link';
import useTheme from '@theme/hooks/useTheme';

const StartComment = '//START\n';

export const Snippet = ({ snippet }) => {
    // who knows how to get this auto refreshing on theme change, heh
    const { isDarkTheme } = useTheme();
    const style = isDarkTheme
        ? require('react-syntax-highlighter/dist/cjs/styles/hljs/stackoverflow-dark').default
        : require('react-syntax-highlighter/dist/cjs/styles/hljs/stackoverflow-light').default;

    const text: string = require(`!raw-loader!../../snippets/${snippet}.tsx`).default as any;
    const startIndex: number = text.indexOf(StartComment);
    const shortenedText = startIndex === -1 ? text : text.substring(startIndex + StartComment.length);
    const { Component } = require(`../../snippets/${snippet}`);
    const [i, setI] = React.useState(0);

    return (
        <div>
          <SyntaxHighlighter language="typescript" style={style}>
            {shortenedText}
          </SyntaxHighlighter>

            <div>
                <div>
                    <Link className="button button--secondary button--sm" onClick={() => setI(i + 1)}>
                        {i === 0 ? 'Run snippet' : 'Run again'}
                    </Link>
                </div>
                {i > 0 && <Component key={i} />}
            </div>
        </div>
    );
};

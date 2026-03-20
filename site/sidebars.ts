import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
    tutorialSidebar: [
        { type: 'doc', label: 'Getting started', id: 'getting-started' },
        { type: 'doc', label: 'Remote Data pattern', id: 'remote-data-pattern' },
        { type: 'doc', label: 'Refreshing Data', id: 'invalidation' },
        { type: 'doc', label: 'Combining stores', id: 'combining-stores' },
        { type: 'doc', label: 'Failures and Retries', id: 'failures-retries' },
        { type: 'doc', label: 'Sharing Data with Child Components', id: 'sharing-data-with-children' },
        { type: 'doc', label: 'Mutations', id: 'mutations' },
        { type: 'doc', label: 'Mutation patterns', id: 'mutation-patterns' },
        { type: 'doc', label: 'Dynamic Data', id: 'dynamic-data' },
        { type: 'doc', label: 'Cancellation', id: 'cancellation' },
        { type: 'doc', label: 'Typed Errors', id: 'typed-errors' },
        { type: 'doc', label: 'Server-Side Rendering', id: 'ssr' },
        { type: 'doc', label: 'Testing', id: 'testing' },
        { type: 'doc', label: 'Debugging', id: 'debugging' },
        {
            type: 'category',
            collapsible: false,
            label: 'Properties',
            items: [
                { type: 'doc', label: 'Lazy loading', id: 'lazy-loading' },
                { type: 'doc', label: 'Data Lifetime', id: 'lifetime' },
                { type: 'doc', label: 'Parallel vs. Sequential Fetching', id: 'parallel' },
            ],
        },
    ],
};

export default sidebars;

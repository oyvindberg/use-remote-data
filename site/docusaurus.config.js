const path = require('path');
const lightCodeTheme = require('prism-react-renderer').themes.github;
const darkCodeTheme = require('prism-react-renderer').themes.dracula;

/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
    title: 'use-remote-data',
    tagline: 'Async data for React, without the guesswork',
    url: 'https://oyvindberg.github.io',
    baseUrl: '/use-remote-data/',
    onBrokenLinks: 'throw',
    favicon: 'img/favicon.ico',
    organizationName: 'oyvindberg',
    projectName: 'use-remote-data',
    themeConfig: {
        navbar: {
            title: 'use-remote-data',
            logo: {
                alt: 'My Site Logo',
                src: 'img/logo.svg',
            },
            items: [
                {
                    to: 'docs/getting-started',
                    position: 'left',
                    label: 'Docs',
                },
                {
                    href: 'https://github.com/oyvindberg/use-remote-data',
                    label: 'GitHub',
                    position: 'right',
                },
            ],
        },
        footer: {
            style: 'dark',
            links: [
                {
                    title: 'Docs',
                    items: [
                        {
                            label: 'Getting started',
                            to: '/docs/getting-started',
                        },
                    ],
                },
                {
                    title: 'Community',
                    items: [
                        {
                            label: 'GitHub',
                            href: 'https://github.com/oyvindberg/use-remote-data',
                        },
                    ],
                },
            ],
            copyright: `Copyright © ${new Date().getFullYear()} Øyvind Raddum Berg`,
        },
        prism: {
            theme: lightCodeTheme,
            darkTheme: darkCodeTheme,
        },
    },
    presets: [
        [
            '@docusaurus/preset-classic',
            {
                docs: {
                    sidebarPath: require.resolve('./sidebars.ts'),
                    editUrl: 'https://github.com/oyvindberg/use-remote-data/edit/master/site/',
                },
                theme: {
                    customCss: require.resolve('./src/css/custom.css'),
                },
            },
        ],
    ],
    plugins: [
        function aliasPlugin() {
            return {
                name: 'use-remote-data-alias',
                configureWebpack() {
                    return {
                        resolve: {
                            alias: {
                                // Resolve 'use-remote-data' imports to the local source.
                                // Snippets import from 'use-remote-data' (as users would),
                                // but webpack serves the live local source — no build step,
                                // no npm link, no stale node_modules copy.
                                'use-remote-data': path.resolve(__dirname, '..', 'src'),
                            },
                        },
                    };
                },
            };
        },
    ],
};

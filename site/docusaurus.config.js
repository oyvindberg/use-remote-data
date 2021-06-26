const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
    title: 'use-remote-data',
    tagline: 'Awesome data access for React',
    url: 'https://your-docusaurus-test-site.com',
    baseUrl: '/use-remote-data/',
    onBrokenLinks: 'throw',
    onBrokenMarkdownLinks: 'warn',
    favicon: 'img/favicon.ico',
    organizationName: 'oyvindberg', // Usually your GitHub org/user name.
    projectName: 'use-remote-data', // Usually your repo name.
    themeConfig: {
        navbar: {
            title: 'use-remote-data',
            logo: {
                alt: 'My Site Logo',
                src: 'img/logo.svg',
            },
            items: [
                {
                    to: 'intro',
                    position: 'left',
                    label: 'Tutorial',
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
                            label: 'Tutorial',
                            to: '/intro',
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
                        // {
                        //     label: 'Stack Overflow',
                        //     href: 'https://stackoverflow.com/questions/tagged/docusaurus',
                        // },
                        // {
                        //     label: 'Discord',
                        //     href: 'https://discordapp.com/invite/docusaurus',
                        // },
                        // {
                        //     label: 'Twitter',
                        //     href: 'https://twitter.com/docusaurus',
                        // },
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
                    sidebarPath: require.resolve('./sidebars.js'),
                    // Please change this to your repo.
                    editUrl: 'https://github.com/facebook/docusaurus/edit/master/website/',
                },
                theme: {
                    customCss: require.resolve('./src/css/custom.css'),
                },
            },
        ],
    ],
};

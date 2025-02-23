import * as React from 'react';
import Layout from '@theme/Layout';
import { Snippet } from '../components/Snippet';
import Link from '@docusaurus/Link';

const typesafeCombine = require('../../static/typesafe-combine.webm').default;

export default () => (
    <Layout title={`Getting started`} description="Getting started">
        <main className="container">
            <h1>Getting started</h1>
            <div>
                <br />
                <h2>Installation</h2>
                <pre>
                    <code>npm install use-remote-data</code>
                </pre>
                <pre>
                    <code>yarn add use-remote-data</code>
                </pre>
            </div>
            <div>
                <br />
                <h2>Basic usage</h2>
                The entry point to the library is a React hook called <code>useRemoteData</code>, which takes one
                parameter: A function which produces a <code>Promise</code>. It needs to be a function and not a
                straight <code>Promise</code>in case it fails and needs to be restarted.
                <br />
                <br />
                According to the rules for React hooks they can only be used within a component, as seen below.
                <br />
                <br />
                The thing we get back is a <code>RemoteDataStore{'<T>'}</code>, which is where we keep the state the
                request is currently in.
                <br />
                <br />
                The last thing which happens in this example is that we use a provided React component called{' '}
                <code>WithRemoteData</code>. This component requires two props:
                <ul>
                    <li>
                        the store we got from <code>useRemoteData</code>
                    </li>
                    <li>
                        a <Link to="https://reactjs.org/docs/render-props.html">render prop </Link>
                        which specifies how to render once we have all the data we asked for by passing stores
                    </li>
                </ul>
                Out of the box this component is useful but not pretty.
                You're expected to either copy/paste `WithRemoteData` into your own app and customize it,
                or wrap it in your own component which customizes pending and failure states.
                <Snippet snippet="basic_usage" />
            </div>
            <br/>
            <h2>Combining stores</h2>
            <p>
                One of the strengths of <code>RemoteDataStore</code> is its composability.
                You can take multiple <code>RemoteDataStore</code>s — each representing
                a separate request—and combine them into a single store. The combined store
                moves through the familiar lifecycle (<code>Pending</code>, <code>Yes</code>,
                <code>No</code>) based on the states of the individual stores:
            </p>
            <ul>
                <li>If <em>any</em> of the underlying stores is <code>RemoteData.Pending</code>,
                    the combined store is <code>Pending</code>.
                </li>
                <li>If <em>all</em> underlying stores are <code>RemoteData.Yes</code>,
                    the combined store provides a tuple of their results.
                </li>
                <li>If <em>any</em> store fails, the combined store fails. When the user clicks “retry,”
                    only the store(s) that failed will be retried; the others remain intact.
                </li>
            </ul>
            <p>
                This approach keeps your data loading logic organized and type-safe.
                In the render prop for <code>WithRemoteData</code>, you can use
                <a href="https://levelup.gitconnected.com/crazy-powerful-typescript-tuple-types-9b121e0a690c"
                > tuple destructuring </a>
                to seamlessly access each store’s result, and TypeScript tooling
                (including IntelliJ) will correctly infer and highlight the types for
                every element in the tuple.
            </p>
            <Snippet snippet="combine" />
            <br/>
            <h3>A note about TypeScript tooling</h3>
            <p>
                The TypeScript compiler (and IDEs like IntelliJ) understands the combined
                store’s shape perfectly. In fact, you can hold the
                <kbd>Ctrl</kbd> (or <kbd>Command</kbd> on macOS) key and hover over the tuple items
                to see their precise types.
            </p>
            <video autoPlay controls muted src={typesafeCombine}></video>

            {/*<div>*/}
            {/*    <br />*/}
            {/*    <h2>Combining stores</h2>*/}
            {/*    The <code>RemoteDataStore</code> structure is composable in the sense that you can combine multiple*/}
            {/*    stores into one which will return the product of all once all the data is available.*/}
            {/*    <br />*/}
            {/*    The semantics are what you would expect. For instance if you combine one request which is currently{' '}*/}
            {/*    <code>RemoteData.Pending</code>*/}
            {/*    with one which is <code>RemoteData.Yes</code>, the result will be <code>RemoteData.Pending</code>.*/}
            {/*    <br />*/}

            {/*    Error handling also just works. If one of the things you combine fails and the user hits "retry",*/}
            {/*    just that one request will be retried, and in applications code you'll get all the values oncee they're*/}
            {/*    available.*/}

            {/*    <br />*/}
            {/*    <br />*/}
            {/*    All types are tracked, and in the render prop given to <code>WithRemoteData</code> we use{' '}*/}
            {/*    <Link to="https://levelup.gitconnected.com/crazy-powerful-typescript-tuple-types-9b121e0a690c">*/}
            {/*        tuple destructuring{' '}*/}
            {/*    </Link>*/}
            {/*    to pick apart the values again.*/}
            {/*    <br />*/}
            {/*    <br />*/}
            {/*    <Snippet snippet="combine" />*/}
            {/*    <br />*/}
            {/*    <h3>A note about Typescript tooling</h3>*/}
            {/*    The Typescript compiler knows everything about the types here, as does Intellij.*/}
            {/*    This video demonstrates how you can press <code>ctrl</code> while hovering with the mouse to see types.*/}
            {/*    <br />*/}
            {/*    <br />*/}
            {/*    <video autoPlay={true} controls={true} muted={true} src={typesafeCombine} />*/}
            {/*</div>*/}
            <div>
                <br />
                <h2>Refreshing data</h2>
                <code>use-remote-data</code> supports seamless invalidation and refreshing of data, by specifying the
                optional <code>invalidation</code> parameter to <code>use-remote-data</code>. You specify an
                invalidation strategy, with for instance how many milliseconds the data is valid after it is received.
                <br />
                <br />
                Once the data is deemed invalidated, you are informed through the second <code>isInvalidated</code>
                argument in the render prop given to <code>WithRemoteData</code>. With that bit of information you can
                for instance render the old data as gray or deactivated while the application is waiting for fresh data.
                <br />
                <br />
                Note that since the design of <code>RemoteDataStore</code> is <em>Lazy</em>, values are only invalidated
                and refreshed <em>while the data is used by a component</em>. However, on first render afterwards the
                invalidation is noticed and you'll be informed through <code>isInvalidated</code> as normal.
                <Snippet snippet="invalidation" />
                <br />
                <h3>Only sometimes?</h3>
                If you want to turn auto-refreshing on and off, that easy to do as well, just set the{' '}
                <code>invalidation</code>
                parameter accordingly
                <Snippet snippet="invalidation_sometimes" />
            </div>
            <div>
                <br />
                <h2>Sharing data with child components</h2>
                A very common use-case is that you have an app with for instance many routes. Each route will need some
                different subsets of data, and you want to keep as much data as possible cached when the user navigates
                back and forth.
                <br />
                <br />
                <code>use-remote-data</code> supports this use-case well because <code>RemoteDataStore</code> is
                <em> Lazy </em> and <em> Caching </em>. You can define all the relevant data stores high up in the
                hierarchy, and data lifetimes neatly follows component lifecycles. You can then freely pass a store to
                any number of code paths, and the data will only be fetched once.
                <Snippet snippet="use_twice" />
                <br />
                <br />
                <h3>Should I pass RemoteDataStore{'<T>'} or just T? </h3>
                There has been some confusion about this, but there is a semantic difference.
                <em>Can this component render without the data?</em>
                Typically you may want to draw an outline of the application before you get any data, and the components
                which do that should probably accept a<code>RemoteDataStore</code> in props.
                <br />
                <br />
                In most other cases it's better to just pass the value after it has been retrieved, for the singular
                reason that it's simpler.
                <br />
                <br />
            </div>
            <div>
                <br />
                <h2>Handling failure</h2>
                Another defining feature of <code>use-remote-data</code> is the principled error handling and the retry
                functionality. Developers typically make an ad-hoc attempt at the former, while not many have the
                discipline to also do the latter.
                <br />
                <br />
                This example creates a <code>Promise</code> which fails every tenth time it is called. The
                sometimes-failing store is combined with another store which never fails, and you should hit{' '}
                <em>retry </em>
                a few times to see the interaction.
                <Snippet snippet="handling_failure" />
            </div>
            <div>
                <br />
                <h2>Dynamic data</h2>
                Do you want to fetch paginated data? fetch quite a few ids out of many? You're covered here too, by the
                <code>useRemoteDatas</code> (plural) hook. In this case you provide a function to
                a <code>Promise</code>{' '}
                which takes a parameter, and you ask the resulting <code>RemoteDataStores</code> structure for the
                corresponding pages/ids.
                <Snippet snippet="dynamic" />
            </div>
            <div>
                <br />
                <h2>Invalidate on dependency change</h2>
                <code>use-remote-data</code> follows the spirit of <code>useEffect</code> and friends by supporting an
                array of dependencies. When a change is detected in that list, the data is automatically invalidated.
                Note that currently the <code>JSON.stringify</code>ed version of the dependencies is compared.
                <Snippet snippet="invalidation_dependencies" />
            </div>
            <div>
                <br />
                <h2>Updates</h2>
                Life is not only read-only though. Here is an example of sending data.
                <Snippet snippet="create" />
                <br />
            </div>
        </main>
    </Layout>
);

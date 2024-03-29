import * as React from 'react';
import Layout from '@theme/Layout';
import { Snippet } from '../components/Snippet';
import Link from '@docusaurus/Link';

export default () => (
    <Layout title={`Getting started`} description="Getting started">
        <main className="container">
            <h1>Getting started</h1>
            <div>
                <h2>Installation</h2>
                <pre>
                    <code>yarn add use-remote-data</code>
                </pre>
            </div>
            <br />
            <div>
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
            <br />
            <div>
                <h2>Combining stores</h2>
                The <code>RemoteDataStore</code> structure is composable in the sense that you can combine multiple
                stores into one which will return the product of all once all the data is available. The semantics are
                what you would expect. For instance if you combine one request which is currently{' '}
                <code>RemoteData.Pending</code>
                with one which is <code>RemoteData.Yes</code>, the result will be <code>RemoteData.Pending</code>.
                <br />
                <br />
                All types are tracked, and in the render prop given to <code>WithRemoteData</code> we use{' '}
                <Link to="https://levelup.gitconnected.com/crazy-powerful-typescript-tuple-types-9b121e0a690c">
                    tuple destructuring{' '}
                </Link>
                to pick apart the values again.
                <br />
                <br />
                <Snippet snippet="combine" />
                <h3>A note about Typescript tooling</h3>
                The Typescript compiler knows everything about the types here. As does Intellij, but it's currently not
                flawless. This video demonstrates how you can press <code>ctrl</code> while hovering with the mouse to
                see types. It also demonstrates how you sometimes need to write types yourself if you want them written
                down.
                <br />
                <br />
                <video autoPlay={true} controls={true} muted={true} src="typesafe-combine.mp4" />
            </div>
            <br />
            <br />
            <div>
                <h2>Refreshing data</h2>
                <code>use-remote-data</code> supports seamless invalidation and refreshing of data, by specifying the
                optional<code>ttlMillis</code> parameter to <code>use-remote-data</code>. You specify how many
                milliseconds the data is valid after it is received.
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
                <br />
                <h3>Only sometimes?</h3>
                If you want to turn auto-refreshing on and off, that easy to do as well, just set the{' '}
                <code>ttlMillis</code>
                parameter accordingly
                <Snippet snippet="invalidation_sometimes" />
            </div>
            <div>
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
                <h2>Dynamic data</h2>
                Do you want to fetch paginated data? fetch quite a few ids out of many? You're covered here too, by the
                <code>useRemoteDatas</code> (plural) hook. In this case you provide a function to a <code>Promise</code>{' '}
                which takes a parameter, and you ask the resulting <code>RemoteDataStores</code> structure for the
                corresponding pages/ids.
                <Snippet snippet="dynamic" />
            </div>
            <div>
                <h2>Invalidate on dependency change</h2>
                <code>use-remote-data</code> follows the spirit of <code>useEffect</code> and friends by supporting an
                array of dependencies. When a change is detected in that list, the data is automatically invalidated.
                Note that currently the <code>JSON.stringify</code>ed version of the dependencies is compared.
                <Snippet snippet="invalidation_dependencies" />
            </div>
        </main>
    </Layout>
);

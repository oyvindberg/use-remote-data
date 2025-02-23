(self.webpackChunksite=self.webpackChunksite||[]).push([[217],{250:(e,t,n)=>{var a={"./basic_usage":3172,"./basic_usage.tsx":3172,"./combine":8789,"./combine.tsx":8789,"./create":3832,"./create.tsx":3832,"./dynamic":9641,"./dynamic.tsx":9641,"./handling_failure":2376,"./handling_failure.tsx":2376,"./invalidation":3544,"./invalidation.tsx":3544,"./invalidation_dependencies":1530,"./invalidation_dependencies.tsx":1530,"./invalidation_sometimes":1667,"./invalidation_sometimes.tsx":1667,"./use_twice":5550,"./use_twice.tsx":5550};function i(e){var t=s(e);return n(t)}function s(e){if(!n.o(a,e)){var t=new Error("Cannot find module '"+e+"'");throw t.code="MODULE_NOT_FOUND",t}return a[e]}i.keys=function(){return Object.keys(a)},i.resolve=s,e.exports=i,i.id=250},409:(e,t,n)=>{"use strict";n.r(t),n.d(t,{default:()=>a});const a="import * as React from 'react';\nimport { RemoteDataStore, useRemoteData, WithRemoteData } from 'use-remote-data';\n\nfunction produce<T>(value: T, delay: number = 1000): Promise<T> {\n    return new Promise((resolve) => setTimeout(() => resolve(value), delay));\n}\n\nexport const Component: React.FC = () => {\n    const computeOne = useRemoteData(() => produce(1));\n    const computeString = useRemoteData(() => produce('Hello'));\n\n    const combinedStore =\n      RemoteDataStore.all(computeOne, computeString);\n\n    return <WithRemoteData store={combinedStore}>\n            {([num, string]) => <span>{num} and {string}</span>}\n        </WithRemoteData>;\n};\n"},809:(e,t,n)=>{"use strict";n.r(t),n.d(t,{assets:()=>c,contentTitle:()=>l,default:()=>m,frontMatter:()=>d,metadata:()=>a,toc:()=>h});const a=JSON.parse('{"type":"mdx","permalink":"/use-remote-data/intro","source":"@site/src/pages/intro.mdx","title":"Getting Started","description":"use-remote-data is a small library that provides a principled, type-safe way to manage asynchronous state in your React applications.","frontMatter":{},"unlisted":false}');var i=n(4848),s=n(8453),r=n(8794),o=n(7879);const d={},l="Getting Started",c={},h=[{value:"Installation",id:"installation",level:2},{value:"The Core State Machine",id:"the-core-state-machine",level:2},{value:"Basic Usage",id:"basic-usage",level:2},{value:"The <code>&lt;WithRemoteData&gt;</code> Component",id:"the-withremotedata-component",level:3},{value:"Lazy Loading",id:"lazy-loading",level:3},{value:"Parallel vs. Sequential Fetching",id:"parallel-vs-sequential-fetching",level:3},{value:"Data Lifetime Aligned with React Components",id:"data-lifetime-aligned-with-react-components",level:3},{value:"Combining Stores",id:"combining-stores",level:2},{value:"A Note on TypeScript Tooling",id:"a-note-on-typescript-tooling",level:4},{value:"Refreshing Data (Invalidation)",id:"refreshing-data-invalidation",level:2},{value:"Only Sometimes?",id:"only-sometimes",level:3},{value:"Sharing Data with Child Components",id:"sharing-data-with-child-components",level:2},{value:"Should I Pass <code>RemoteDataStore&lt;T&gt;</code> or Just <code>T</code>?",id:"should-i-pass-remotedatastoret-or-just-t",level:3},{value:"Handling Failure and Retries",id:"handling-failure-and-retries",level:2},{value:"Dynamic Data",id:"dynamic-data",level:2},{value:"Invalidate on Dependency Change",id:"invalidate-on-dependency-change",level:2},{value:"Updates (Write Operations)",id:"updates-write-operations",level:2},{value:"Conclusion",id:"conclusion",level:2}];function u(e){const t={a:"a",blockquote:"blockquote",code:"code",em:"em",h1:"h1",h2:"h2",h3:"h3",h4:"h4",header:"header",hr:"hr",li:"li",ol:"ol",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,s.R)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(t.header,{children:(0,i.jsx)(t.h1,{id:"getting-started",children:"Getting Started"})}),"\n",(0,i.jsxs)(t.p,{children:[(0,i.jsx)(t.code,{children:"use-remote-data"})," is a small library that provides a principled, type-safe way to manage asynchronous state in your React applications.\nIt revolves around a ",(0,i.jsx)(t.strong,{children:"core state machine"})," represented by the ",(0,i.jsx)(t.code,{children:"RemoteData"})," type and a corresponding\n",(0,i.jsx)(t.code,{children:"RemoteDataStore"})," that orchestrates fetching,\ncaching, invalidation,\nand retries\u2014all while staying strongly typed."]}),"\n",(0,i.jsx)(t.hr,{}),"\n",(0,i.jsx)(t.h2,{id:"installation",children:"Installation"}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{className:"language-bash",children:"npm install use-remote-data\n"})}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{className:"language-bash",children:"yarn add use-remote-data\n"})}),"\n",(0,i.jsx)(t.hr,{}),"\n",(0,i.jsx)(t.h2,{id:"the-core-state-machine",children:"The Core State Machine"}),"\n",(0,i.jsxs)(t.p,{children:["At the heart of this library is the ",(0,i.jsx)(t.strong,{children:(0,i.jsx)(t.code,{children:"RemoteData"})})," type.\nIt captures all possible states of an async request in a single union:"]}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{className:"language-ts",children:"export type RemoteData<T> =\n  | { type: 'initial' }\n  | { type: 'pending' }\n  | { type: 'no'; errors: ReadonlyArray<Error | unknown>; retry: () => Promise<void> }\n  | { type: 'yes'; value: T }\n  | { type: 'invalidated-initial'; invalidated: T }\n  | { type: 'invalidated-pending'; invalidated: T };\n"})}),"\n",(0,i.jsx)(t.p,{children:"This state machine allows the library to cleanly handle the life cycle of any request:"}),"\n",(0,i.jsxs)(t.ul,{children:["\n",(0,i.jsxs)(t.li,{children:[(0,i.jsx)(t.strong,{children:(0,i.jsx)(t.code,{children:"initial"})}),": We haven\u2019t started fetching yet (lazy load)."]}),"\n",(0,i.jsxs)(t.li,{children:[(0,i.jsx)(t.strong,{children:(0,i.jsx)(t.code,{children:"pending"})}),": A request is ongoing (fetch in progress)."]}),"\n",(0,i.jsxs)(t.li,{children:[(0,i.jsx)(t.strong,{children:(0,i.jsx)(t.code,{children:"no"})}),": The request failed (includes errors and a retry callback)."]}),"\n",(0,i.jsxs)(t.li,{children:[(0,i.jsx)(t.strong,{children:(0,i.jsx)(t.code,{children:"yes"})}),": The request succeeded (includes the fetched value)."]}),"\n",(0,i.jsxs)(t.li,{children:[(0,i.jsx)(t.strong,{children:(0,i.jsx)(t.code,{children:"invalidated-initial"})}),": We have stale data but haven\u2019t started fetching."]}),"\n",(0,i.jsxs)(t.li,{children:[(0,i.jsx)(t.strong,{children:(0,i.jsx)(t.code,{children:"invalidated-pending"})}),": We have stale data and are fetching an update."]}),"\n"]}),"\n",(0,i.jsx)(t.p,{children:"By modeling states explicitly, React components can branch on them in a straightforward and type-safe manner."}),"\n",(0,i.jsx)(t.hr,{}),"\n",(0,i.jsx)(t.h2,{id:"basic-usage",children:"Basic Usage"}),"\n",(0,i.jsxs)(t.p,{children:["The primary entry point is the ",(0,i.jsx)(t.strong,{children:(0,i.jsx)(t.code,{children:"useRemoteData"})})," hook.\nIt takes one parameter\u2014a function that produces a ",(0,i.jsx)(t.code,{children:"Promise"}),"\u2014and returns a ",(0,i.jsx)(t.code,{children:"RemoteDataStore<T>"}),".\nBecause we need the ability to retry, you must pass a function rather than a direct ",(0,i.jsx)(t.code,{children:"Promise"}),"."]}),"\n",(0,i.jsxs)(t.ul,{children:["\n",(0,i.jsxs)(t.li,{children:["According to ",(0,i.jsx)(t.a,{href:"https://reactjs.org/docs/hooks-rules.html",children:"React Hooks rules"}),", the hook must be used inside a component."]}),"\n",(0,i.jsxs)(t.li,{children:["The object returned by ",(0,i.jsx)(t.code,{children:"useRemoteData"})," is our ",(0,i.jsx)(t.code,{children:"RemoteDataStore<T>"}),"."]}),"\n"]}),"\n",(0,i.jsx)(r.Y,{snippet:"basic_usage"}),"\n",(0,i.jsxs)(t.h3,{id:"the-withremotedata-component",children:["The ",(0,i.jsx)(t.code,{children:"<WithRemoteData>"})," Component"]}),"\n",(0,i.jsxs)(t.p,{children:["The library provides a small helper component called ",(0,i.jsx)(t.code,{children:"WithRemoteData"})," for convenience. It expects two props:"]}),"\n",(0,i.jsxs)(t.ol,{children:["\n",(0,i.jsxs)(t.li,{children:[(0,i.jsx)(t.strong,{children:(0,i.jsx)(t.code,{children:"store"})}),": The ",(0,i.jsx)(t.code,{children:"RemoteDataStore"})," returned by ",(0,i.jsx)(t.code,{children:"useRemoteData"}),"."]}),"\n",(0,i.jsxs)(t.li,{children:[(0,i.jsx)(t.strong,{children:(0,i.jsx)(t.code,{children:"render"})}),": A ",(0,i.jsx)(t.a,{href:"https://reactjs.org/docs/render-props.html",children:"render prop"})," that receives your successfully loaded data (along with an ",(0,i.jsx)(t.code,{children:"isInvalidated"})," boolean)."]}),"\n"]}),"\n",(0,i.jsxs)(t.p,{children:["Out of the box, ",(0,i.jsx)(t.code,{children:"WithRemoteData"})," handles loading and error states but is visually minimal.\nYou can copy it directly into your codebase\nor wrap it to provide custom styling and behavior for pending and failure states."]}),"\n",(0,i.jsx)(t.h3,{id:"lazy-loading",children:"Lazy Loading"}),"\n",(0,i.jsxs)(t.p,{children:["An interesting aspect of ",(0,i.jsx)(t.code,{children:"useRemoteData"})," is no data is fetched when you call ",(0,i.jsx)(t.code,{children:"useRemoteData"}),"."]}),"\n",(0,i.jsxs)(t.p,{children:["Only when the data is rendered with ",(0,i.jsx)(t.code,{children:"WithRemoteData"})," is the request initiated.\nThis is handy, because then you can initialize many ",(0,i.jsx)(t.code,{children:"RemoteDataStore"}),"s in a component high up in the hierarchy, and pass them down to children."]}),"\n",(0,i.jsx)(t.h3,{id:"parallel-vs-sequential-fetching",children:"Parallel vs. Sequential Fetching"}),"\n",(0,i.jsxs)(t.p,{children:["When your app renders data from multiple ",(0,i.jsx)(t.code,{children:"RemoteDataStore"})," instances, they will initiate their requests in parallel if the data is missing or old."]}),"\n",(0,i.jsx)(t.p,{children:"This parallel behavior ensures quicker overall loading times when you need multiple pieces of data at once."}),"\n",(0,i.jsxs)(t.p,{children:["If you need to fetch data in a specific order, you can achieve this by nesting ",(0,i.jsx)(t.code,{children:"WithData"})," inside ",(0,i.jsx)(t.code,{children:"WithData"})," in your JSX,\nmeaning that the inner won't be rendered/requested until the outer has finished."]}),"\n",(0,i.jsx)(t.h3,{id:"data-lifetime-aligned-with-react-components",children:"Data Lifetime Aligned with React Components"}),"\n",(0,i.jsx)(t.p,{children:"Because each store is created by the hook in a mounted component, data only exists as long as that component is active.\nThere\u2019s no global state or context\u2014once the component unmounts, the store is effectively garbage-collected.\nThis design ensures data is retained only while it\u2019s relevant."}),"\n",(0,i.jsx)(t.hr,{}),"\n",(0,i.jsx)(t.h2,{id:"combining-stores",children:"Combining Stores"}),"\n",(0,i.jsxs)(t.p,{children:["One of the library\u2019s most powerful patterns is combining multiple requests.\nIf you have two or more ",(0,i.jsx)(t.code,{children:"RemoteDataStore"}),"s,\nyou can merge them into a single store that represents all requests in flight.\nThis is done via ",(0,i.jsx)(t.code,{children:"RemoteDataStore.all(...)"}),":"]}),"\n",(0,i.jsxs)(t.p,{children:["Under the hood, the combined store uses the ",(0,i.jsx)(t.code,{children:"RemoteData.all(...)"})," function, which:"]}),"\n",(0,i.jsxs)(t.ul,{children:["\n",(0,i.jsxs)(t.li,{children:["Returns ",(0,i.jsx)(t.code,{children:"No"})," if ",(0,i.jsx)(t.em,{children:"any"})," store fails. A single \u201cretry\u201d will only re-fetch the failing requests."]}),"\n",(0,i.jsxs)(t.li,{children:["Returns ",(0,i.jsx)(t.code,{children:"Pending"})," if ",(0,i.jsx)(t.em,{children:"any"})," constituent store is ",(0,i.jsx)(t.code,{children:"Pending"}),"."]}),"\n",(0,i.jsxs)(t.li,{children:["Returns ",(0,i.jsx)(t.code,{children:"Yes"})," with a tuple of all combined values if ",(0,i.jsx)(t.em,{children:"all"})," succeed."]}),"\n",(0,i.jsx)(t.li,{children:"Manages invalidation states if any store becomes invalidated."}),"\n"]}),"\n",(0,i.jsxs)(t.p,{children:["In a render prop, you can\n",(0,i.jsx)(t.a,{href:"https://levelup.gitconnected.com/crazy-powerful-typescript-tuple-types-9b121e0a690c",children:"destructure"}),"\nthe results."]}),"\n",(0,i.jsx)(r.Y,{snippet:"combine"}),"\n",(0,i.jsx)(t.h4,{id:"a-note-on-typescript-tooling",children:"A Note on TypeScript Tooling"}),"\n",(0,i.jsxs)(t.p,{children:["The TypeScript compiler (and IDEs) fully understands these combined stores.\nYou can hover over the tuple items (often with ",(0,i.jsx)("kbd",{children:"Ctrl"})," or ",(0,i.jsx)("kbd",{children:"Command"}),") to see precise type information."]}),"\n",(0,i.jsx)("video",{autoPlay:!0,controls:!0,muted:!0,style:{maxWidth:"100%"},src:o.A}),"\n",(0,i.jsx)(t.hr,{}),"\n",(0,i.jsx)(t.h2,{id:"refreshing-data-invalidation",children:"Refreshing Data (Invalidation)"}),"\n",(0,i.jsxs)(t.p,{children:["Sometimes data becomes out-of-date.\nsupports \u201cinvalidation\u201d through an optional ",(0,i.jsx)(t.code,{children:"invalidation"})," parameter on the hook.\nAn ",(0,i.jsx)(t.strong,{children:(0,i.jsx)(t.code,{children:"InvalidationStrategy<T>"})})," is a small object that decides whether to keep data or mark it stale.\nFor example:"]}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{className:"language-ts",children:"{\n  invalidation: InvalidationStrategy.refetchAfterMillis(10_000);\n}\n"})}),"\n",(0,i.jsxs)(t.p,{children:["If the data is older than 10 seconds, the store automatically transitions into one of the ",(0,i.jsx)(t.code,{children:"invalidated-*"})," states.\nIn the ",(0,i.jsx)(t.code,{children:"<WithRemoteData>"})," render prop,\nyou can check the second argument (",(0,i.jsx)(t.code,{children:"isInvalidated"}),")\nto decide whether to let the user see old data or a loading indicator."]}),"\n",(0,i.jsx)(r.Y,{snippet:"invalidation"}),"\n",(0,i.jsx)(t.h3,{id:"only-sometimes",children:"Only Sometimes?"}),"\n",(0,i.jsxs)(t.p,{children:["You can enable or disable invalidation dynamically by swapping the ",(0,i.jsx)(t.code,{children:"invalidation"})," strategy in or out. For instance:"]}),"\n",(0,i.jsx)(r.Y,{snippet:"invalidation_sometimes"}),"\n",(0,i.jsx)(t.hr,{}),"\n",(0,i.jsx)(t.h2,{id:"sharing-data-with-child-components",children:"Sharing Data with Child Components"}),"\n",(0,i.jsx)(t.p,{children:"A common pattern is to fetch data high in your component tree and share it among multiple routes or components,\nleveraging built-in caching so that each route doesn\u2019t refetch unnecessarily."}),"\n",(0,i.jsxs)(t.p,{children:["Since ",(0,i.jsx)(t.code,{children:"RemoteDataStore"})," is both ",(0,i.jsx)(t.em,{children:"lazy"})," and ",(0,i.jsx)(t.em,{children:"caching"}),", you can pass the same store to multiple children.\nData is fetched only once, and the results remain in memory as long as a store is in use."]}),"\n",(0,i.jsx)(r.Y,{snippet:"use_twice"}),"\n",(0,i.jsxs)(t.h3,{id:"should-i-pass-remotedatastoret-or-just-t",children:["Should I Pass ",(0,i.jsx)(t.code,{children:"RemoteDataStore<T>"})," or Just ",(0,i.jsx)(t.code,{children:"T"}),"?"]}),"\n",(0,i.jsx)(t.p,{children:"There\u2019s a subtle difference:"}),"\n",(0,i.jsxs)(t.blockquote,{children:["\n",(0,i.jsx)(t.p,{children:(0,i.jsx)(t.em,{children:"Does the child component need to render anything while data is still loading?"})}),"\n"]}),"\n",(0,i.jsxs)(t.ul,{children:["\n",(0,i.jsxs)(t.li,{children:["If yes, consider passing a ",(0,i.jsx)(t.code,{children:"RemoteDataStore<T>"})," so the child can handle loading/failure states."]}),"\n",(0,i.jsxs)(t.li,{children:["Otherwise, if the parent already handles loading and passes down final data, just pass ",(0,i.jsx)(t.code,{children:"T"}),"."]}),"\n"]}),"\n",(0,i.jsx)(t.hr,{}),"\n",(0,i.jsx)(t.h2,{id:"handling-failure-and-retries",children:"Handling Failure and Retries"}),"\n",(0,i.jsxs)(t.p,{children:["Another defining feature of ",(0,i.jsx)(t.code,{children:"use-remote-data"})," is the principled error handling and the retry\nfunctionality.\nDevelopers typically make an ad-hoc attempt at the former, while not many have the\ndiscipline to also do the latter."]}),"\n",(0,i.jsxs)(t.p,{children:["This example creates a ",(0,i.jsx)(t.code,{children:"Promise"})," which fails every tenth time it is called.\nThe sometimes-failing store is combined with another store which never fails,\nand you should hit ",(0,i.jsx)(t.em,{children:"retry"})," a few times to see the interaction."]}),"\n",(0,i.jsx)(r.Y,{snippet:"handling_failure"}),"\n",(0,i.jsx)(t.hr,{}),"\n",(0,i.jsx)(t.h2,{id:"dynamic-data",children:"Dynamic Data"}),"\n",(0,i.jsxs)(t.p,{children:["If you need parameterized requests\u2014like paginated lists\nor fetching multiple resource IDs\u2014use the ",(0,i.jsx)(t.strong,{children:(0,i.jsx)(t.code,{children:"useRemoteDatas"})})," (plural) hook.\nIt returns an object with a ",(0,i.jsx)(t.code,{children:".get(key)"})," method for each distinct data slice."]}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{className:"language-tsx",children:"const itemsStore = useRemoteDatas(\n  (page: number) => fetch(`/api/items?page=${page}`).then((res) => res.json())\n);\n\nconst firstPageStore = itemsStore.get(1);\nconst secondPageStore = itemsStore.get(2);\n"})}),"\n",(0,i.jsxs)(t.p,{children:["This creates independent ",(0,i.jsx)(t.code,{children:"RemoteDataStore"})," objects for each page, all managed under one ",(0,i.jsx)(t.code,{children:"RemoteDataStores"})," instance."]}),"\n",(0,i.jsx)(r.Y,{snippet:"dynamic"}),"\n",(0,i.jsx)(t.hr,{}),"\n",(0,i.jsx)(t.h2,{id:"invalidate-on-dependency-change",children:"Invalidate on Dependency Change"}),"\n",(0,i.jsxs)(t.p,{children:[(0,i.jsx)(t.code,{children:"useRemoteData"})," and ",(0,i.jsx)(t.code,{children:"useRemoteDatas"})," let you provide a ",(0,i.jsx)(t.code,{children:"dependencies"})," array (similar to React\u2019s ",(0,i.jsx)(t.code,{children:"useEffect"}),"):"]}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{className:"language-tsx",children:"useRemoteData(() => fetchData(), {\n  dependencies: [props.userId, otherValue],\n});\n"})}),"\n",(0,i.jsxs)(t.p,{children:["When the dependency array changes, the store invalidates automatically, and ",(0,i.jsx)(t.code,{children:"triggerUpdate()"})," will re-fetch if needed.\n(Currently, it compares dependencies by ",(0,i.jsx)(t.code,{children:"JSON.stringify"}),".)"]}),"\n",(0,i.jsx)(r.Y,{snippet:"invalidation_dependencies"}),"\n",(0,i.jsx)(t.hr,{}),"\n",(0,i.jsx)(t.h2,{id:"updates-write-operations",children:"Updates (Write Operations)"}),"\n",(0,i.jsxs)(t.p,{children:["Your application might need to send data back to the server.\nWhile ",(0,i.jsx)(t.code,{children:"use-remote-data"})," focuses on read operations,\nyou can still integrate writes by calling out to the server in your components.\nAfter a successful write,\ncall ",(0,i.jsx)(t.code,{children:"invalidate()"})," or ",(0,i.jsx)(t.code,{children:"triggerUpdate()"})," to refresh any store that depends on the changed data."]}),"\n",(0,i.jsx)(r.Y,{snippet:"create"}),"\n",(0,i.jsx)(t.hr,{}),"\n",(0,i.jsx)(t.h2,{id:"conclusion",children:"Conclusion"}),"\n",(0,i.jsxs)(t.p,{children:[(0,i.jsx)(t.code,{children:"use-remote-data"})," provides a comprehensive, type-safe approach to async state management in React.\nIt builds on a clear state machine (",(0,i.jsx)(t.code,{children:"RemoteData"}),"), robust invalidation (",(0,i.jsx)(t.code,{children:"InvalidationStrategy"}),"), and fully typed store composition."]})]})}function m(e={}){const{wrapper:t}={...(0,s.R)(),...e.components};return t?(0,i.jsx)(t,{...e,children:(0,i.jsx)(u,{...e})}):u(e)}},1180:(e,t,n)=>{"use strict";n.r(t),n.d(t,{default:()=>a});const a="import * as React from 'react';\nimport { useRemoteData, WithRemoteData, InvalidationStrategy } from 'use-remote-data';\n\nvar i = 0;\nconst freshData = (): Promise<number> =>\n    new Promise((resolve) => {\n        i += 1;\n        setTimeout(() => resolve(i), 1000);\n    });\n\nexport const Component: React.FC = () => {\n    const store = useRemoteData(freshData, { invalidation: InvalidationStrategy.refetchAfterMillis(2000) });\n\n    return (\n        <WithRemoteData store={store}>\n            {(num, isInvalidated) =>\n                <span style={{ color: isInvalidated ? 'darkgray' : 'black' }}>{num}</span>\n            }\n        </WithRemoteData>\n    );\n};\n"},1266:(e,t,n)=>{var a={"./basic_usage.tsx":8936,"./combine.tsx":409,"./create.tsx":2556,"./dynamic.tsx":5525,"./handling_failure.tsx":5588,"./invalidation.tsx":1180,"./invalidation_dependencies.tsx":2542,"./invalidation_sometimes.tsx":9439,"./use_twice.tsx":5170};function i(e){var t=s(e);return n(t)}function s(e){if(!n.o(a,e)){var t=new Error("Cannot find module '"+e+"'");throw t.code="MODULE_NOT_FOUND",t}return a[e]}i.keys=function(){return Object.keys(a)},i.resolve=s,e.exports=i,i.id=1266},1530:(e,t,n)=>{"use strict";n.r(t),n.d(t,{Component:()=>d});var a=n(6540),i=n(3541),s=n(4848),r=0;const o=()=>new Promise((e=>{r+=1,setTimeout((()=>e(r)),1e3)})),d=()=>{const[e,t]=a.useState(1),n=(0,i.mp)(o,{dependencies:[e]});return(0,s.jsxs)("div",{children:[(0,s.jsx)("button",{onClick:()=>t(e+1),children:"Bump dep"}),(0,s.jsx)("br",{}),(0,s.jsx)(i.nS,{store:n,children:(e,t)=>(0,s.jsx)("span",{style:{color:t?"darkgray":"black"},children:e})})]})}},1667:(e,t,n)=>{"use strict";n.r(t),n.d(t,{Component:()=>d});var a=n(6540),i=n(3541),s=n(4848),r=0;const o=()=>new Promise((e=>{r+=1,setTimeout((()=>e(r)),1e3)})),d=()=>{const[e,t]=a.useState(!0),n=(0,i.mp)(o,{invalidation:e?i.Mf.refetchAfterMillis(1e3):void 0});return(0,s.jsxs)("div",{children:[(0,s.jsxs)("label",{children:["Autorefresh:",(0,s.jsx)("input",{type:"checkbox",onChange:n=>t(!e),checked:e})]}),(0,s.jsx)("br",{}),(0,s.jsx)(i.nS,{store:n,children:(e,t)=>(0,s.jsx)("span",{style:{color:t?"darkgray":"black"},children:e})})]})}},2376:(e,t,n)=>{"use strict";n.r(t),n.d(t,{Component:()=>l});n(6540);var a=n(3541),i=n(4848),s=0;const r=()=>new Promise((e=>{s+=1,setTimeout((()=>e(s)),1e3)}));var o=0;const d=()=>new Promise(((e,t)=>{(o+=1)%10==0?t(`${o} was dividable by 10`):e(o)})),l=()=>{const e=(0,a.mp)(r,{invalidation:a.Mf.refetchAfterMillis(1e3)}),t=(0,a.mp)(d,{invalidation:a.Mf.refetchAfterMillis(100)});return(0,i.jsx)(a.nS,{store:a.Qt.all(e,t),children:e=>{let[t,n]=e;return(0,i.jsxs)("span",{children:[t," - ",n]})}})}},2542:(e,t,n)=>{"use strict";n.r(t),n.d(t,{default:()=>a});const a="import * as React from 'react';\nimport { useRemoteData, WithRemoteData } from 'use-remote-data';\n\nvar i = 0;\nconst freshData = (): Promise<number> =>\n    new Promise((resolve) => {\n        i += 1;\n        setTimeout(() => resolve(i), 1000);\n    });\n\nexport const Component: React.FC = () => {\n    const [dep, setDep] = React.useState(1);\n    const store = useRemoteData(freshData, { dependencies: [dep] });\n\n    return (\n        <div>\n            <button onClick={() => setDep(dep + 1)}>Bump dep</button>\n            <br />\n            <WithRemoteData store={store}>\n                {(num, isInvalidated) => <span style={{ color: isInvalidated ? 'darkgray' : 'black' }}>{num}</span>}\n            </WithRemoteData>\n        </div>\n    );\n};\n"},2556:(e,t,n)=>{"use strict";n.r(t),n.d(t,{default:()=>a});const a="import * as React from 'react';\nimport { useRemoteData, WithRemoteData } from 'use-remote-data';\n\nconst createUser = (name: string): Promise<string> =>\n    new Promise((resolve) => {\n        setTimeout(() => resolve(`created user with name ${name} and id #1`), 1000);\n    });\n\nexport const Component: React.FC = () => {\n    const [name, setName] = React.useState('');\n    const [submit, setSubmit] = React.useState(false);\n    const createUserStore = useRemoteData(() => createUser(name));\n\n    return (\n        <div>\n            <h4>Create user</h4>\n            <label>\n                name:\n                <input onChange={(e) => setName(e.currentTarget.value)} value={name} />\n            </label>\n            <button onClick={() => setSubmit(true)}>Create user</button>\n            {submit && <WithRemoteData store={createUserStore}>{(msg) => <p>{msg}</p>}</WithRemoteData>}\n        </div>\n    );\n};"},3172:(e,t,n)=>{"use strict";n.r(t),n.d(t,{Component:()=>s});n(6540);var a=n(3541),i=n(4848);const s=()=>{const e=(0,a.mp)((()=>{return e=1,void 0===t&&(t=1e3),new Promise((n=>setTimeout((()=>n(e)),t)));var e,t}));return(0,i.jsx)(a.nS,{store:e,children:e=>(0,i.jsx)("span",{children:e})})}},3541:(e,t,n)=>{"use strict";n.d(t,{Mf:()=>o,Qt:()=>h,nS:()=>x,mp:()=>j,$o:()=>f});var a=n(4848);const i=({storeName:e,errors:t,retry:n})=>{const i=e?(0,a.jsxs)("strong",{children:["Failed request for store ",e]}):(0,a.jsx)("strong",{children:"Failed request"}),s=t.map(((e,t)=>e instanceof Error?(0,a.jsxs)("div",{children:[(0,a.jsxs)("span",{children:[e.name,": ",e.message]}),(0,a.jsx)("pre",{children:(0,a.jsx)("code",{children:e.stack})})]},t):(0,a.jsx)("div",{children:(0,a.jsx)("pre",{children:(0,a.jsx)("code",{children:JSON.stringify(e)})})},t)));return(0,a.jsxs)("div",{children:[i,s,(0,a.jsx)("button",{onClick:n,children:"retry"})]})},s=()=>(0,a.jsx)("div",{children:"..."});var r,o;!function(e){e.Valid={type:"valid"},e.InvalidateIn=e=>({type:"invalidate-in",millis:e}),e.Invalidated={type:"invalidated"}}(r||(r={})),function(e){e.of=e=>({decide:e}),e.alwaysValid=()=>e.of((()=>r.Valid)),e.pollUntil=(t,n)=>e.of(((e,a,i)=>{if(t(e))return r.Valid;const s=Math.max(a.getTime()+n-i.getTime(),1);return r.InvalidateIn(s)})),e.refetchAfterMillis=t=>e.of(((e,n,a)=>{const i=n.getTime()+t-a.getTime();return i<=0?r.Invalidated:r.InvalidateIn(i+1)}))}(o||(o={}));const d=e=>null!=e;var l,c;!function(e){e.Initial={type:"initial"},e.Pending={type:"pending"},e.No=(e,t)=>({type:"no",errors:e,retry:t}),e.Yes=e=>({type:"yes",value:e}),e.InvalidatedInitial=e=>({type:"invalidated-initial",invalidated:e}),e.InvalidatedPending=e=>({type:"invalidated-pending",invalidated:e}),e.all=(...t)=>{const n=[];let a,i,s=!1,r=[];for(const e of t)switch(e.type){case"yes":n.push(e.value);break;case"invalidated-initial":case"invalidated-pending":s=!0,n.push(e.invalidated.value);break;case"initial":i=e;break;case"no":r.push(e);break;case"pending":a=e}if(r.length>0){const t=()=>Promise.all(r.map((e=>e.retry()))).then((()=>{})),n=r.reduce(((e,t)=>[...e,...t.errors]),[]);return e.No(n,t)}if(d(a))return a;if(d(i))return i;const o=e.Yes(n);return s?e.InvalidatedPending(o):o},e.orNull=t=>e.fold(t)((e=>e),(()=>null),(e=>null)),e.fold=e=>(t,n,a)=>{switch(e.type){case"initial":case"pending":return n();case"yes":return t(e.value,!1);case"no":return a(e.errors,e.retry);case"invalidated-initial":case"invalidated-pending":return t(e.invalidated.value,!0)}},e.pendingStateFor=t=>{switch(t.type){case"invalidated-initial":return e.InvalidatedPending(t.invalidated);case"yes":return e.InvalidatedPending(t);default:return e.Pending}},e.initialStateFor=t=>"yes"===t.type?e.InvalidatedInitial(t):e.Initial}(l||(l={})),function(e){e.all=e=>{const t=e.filter(d);if(0!==t.length)return()=>t.forEach((e=>e()))}}(c||(c={}));var h,u=function(e,t,n,a,i){if("m"===a)throw new TypeError("Private method is not writable");if("a"===a&&!i)throw new TypeError("Private accessor was defined without a setter");if("function"==typeof t?e!==t||!i:!t.has(e))throw new TypeError("Cannot write private member to an object whose class did not declare it");return"a"===a?i.call(e,n):i?i.value=n:t.set(e,n),n},m=function(e,t,n,a){if("a"===n&&!a)throw new TypeError("Private accessor was defined without a getter");if("function"==typeof t?e!==t||!a:!t.has(e))throw new TypeError("Cannot read private member from an object whose class did not declare it");return"m"===n?a:"a"===n?a.call(e):a?a.value:t.get(e)};!function(e){var t;e.always=(e,t)=>({triggerUpdate:()=>{},current:e,storeName:t,invalidate:()=>{}}),e.orNull=e=>({get current(){return l.Yes(l.orNull(e.current))},invalidate:e.invalidate,triggerUpdate:e.triggerUpdate,storeName:e.storeName}),e.all=(...e)=>new n(e);class n{constructor(e){t.set(this,void 0),this.triggerUpdate=()=>{if("no"!==this.current.type)return c.all(m(this,t,"f").map((e=>e.triggerUpdate())))},this.invalidate=()=>m(this,t,"f").forEach((e=>e.invalidate())),u(this,t,e,"f")}get current(){return l.all(...m(this,t,"f").map((e=>e.current)))}get storeName(){return m(this,t,"f").map((e=>e.storeName)).filter(d).join(", ")}}t=new WeakMap}(h||(h={}));var p,v=n(6540);function x({store:e,children:t,ErrorComponent:n=i,PendingComponent:r=s}){return(0,v.useEffect)(e.triggerUpdate,[e]),l.fold(e.current)(((e,n)=>(0,a.jsx)("div",{children:t(e,n)})),(()=>(0,a.jsx)(r,{})),((t,i)=>(0,a.jsx)(n,{errors:t,retry:i,storeName:e.storeName})))}!function(e){e.of=e=>void 0===e?"undefined":JSON.stringify(e)}(p||(p={}));const g=Number(v.version.split(".")[0]),f=(e,t={})=>{const[n,a]=(0,v.useState)(new Map),[i,s]=(0,v.useState)(new Map),[r,o]=(0,v.useState)(t.dependencies),c=e=>{if(d(t.storeName))return void 0!==e?`${t.storeName}(${e})`:t.storeName};let h=!0;g<18&&(0,v.useEffect)((()=>()=>{t.debug&&console.warn(`${c(void 0)} unmounting`),h=!1}),[]);const u=(e,n,i)=>{h?(t.debug&&console.warn(`${c(e)} => `,n,i),d(i)&&s((t=>{const n=new Map(t);return n.set(e,i),n})),a((t=>{const a=new Map(t);return a.set(e,n),a}))):t.debug&&console.warn(`${c(e)} dropped update because component has been unmounted`,n,i)},m=(t,n,a)=>(u(n,a),e(t).then((e=>u(n,l.Yes(e),new Date))).catch((e=>u(n,l.No([e],(()=>m(t,n,l.Pending))))))),x=new Map,f=e=>{const s=p.of(e);return{storeName:c(s),get current(){return n.get(s)||l.Initial},invalidate:()=>{u(s,l.initialStateFor(n.get(s)||l.Initial))},triggerUpdate:()=>((e,s)=>{if(p.of(r)!==p.of(t.dependencies)){t.debug&&console.warn(`${c(s)} invalidating due to deps, from/to:`,r,t.dependencies),o(t.dependencies);const e=new Map;return n.forEach(((t,n)=>e.set(n,l.initialStateFor(t)))),void a(e)}if(x.get(s))return;x.set(s,!0);const h=n.get(s)||l.Initial;if("initial"===h.type||"invalidated-initial"===h.type)return void m(e,s,l.pendingStateFor(h));const v=i.get(s);if(d(t.invalidation)&&"yes"===h.type&&d(v)){const e=t.invalidation.decide(h.value,v,new Date);switch(e.type){case"invalidated":return void u(s,l.InvalidatedInitial(h));case"valid":return;case"invalidate-in":t.debug&&console.warn(`${c(s)}: will invalidate in ${e.millis}`);const n=setTimeout((()=>u(s,l.InvalidatedInitial(h))),e.millis);return()=>clearTimeout(n)}}})(e,s)}};return{get:f,getMany:e=>e.map(f)}},j=(e,t)=>f(e,t).get(void 0)},3544:(e,t,n)=>{"use strict";n.r(t),n.d(t,{Component:()=>o});n(6540);var a=n(3541),i=n(4848),s=0;const r=()=>new Promise((e=>{s+=1,setTimeout((()=>e(s)),1e3)})),o=()=>{const e=(0,a.mp)(r,{invalidation:a.Mf.refetchAfterMillis(2e3)});return(0,i.jsx)(a.nS,{store:e,children:(e,t)=>(0,i.jsx)("span",{style:{color:t?"darkgray":"black"},children:e})})}},3832:(e,t,n)=>{"use strict";n.r(t),n.d(t,{Component:()=>r});var a=n(6540),i=n(3541),s=n(4848);const r=()=>{const[e,t]=a.useState(""),[n,r]=a.useState(!1),o=(0,i.mp)((()=>(e=>new Promise((t=>{setTimeout((()=>t(`created user with name ${e} and id #1`)),1e3)})))(e)));return(0,s.jsxs)("div",{children:[(0,s.jsx)("h4",{children:"Create user"}),(0,s.jsxs)("label",{children:["name:",(0,s.jsx)("input",{onChange:e=>t(e.currentTarget.value),value:e})]}),(0,s.jsx)("button",{onClick:()=>r(!0),children:"Create user"}),n&&(0,s.jsx)(i.nS,{store:o,children:e=>(0,s.jsx)("p",{children:e})})]})}},5170:(e,t,n)=>{"use strict";n.r(t),n.d(t,{default:()=>a});const a="import * as React from 'react';\nimport { InvalidationStrategy, RemoteDataStore, useRemoteData, WithRemoteData } from 'use-remote-data';\n\nvar i = 0;\nconst freshData = (): Promise<number> =>\n    new Promise((resolve) => {\n        i += 1;\n        setTimeout(() => resolve(i), 1000);\n    });\n\nexport const Component: React.FC = () => {\n    const store = useRemoteData(freshData, { invalidation: InvalidationStrategy.refetchAfterMillis(2000) });\n\n    return (\n        <div>\n            <Child store={store} />\n            <Child store={store} />\n        </div>\n    );\n};\n\nexport const Child: React.FC<{ store: RemoteDataStore<number> }> = ({ store }) => (\n    <WithRemoteData store={store}>\n        {(num, isInvalidated) =>\n            <p><span style={{ color: isInvalidated ? 'darkgray' : 'black' }}>{num}</span></p>\n        }\n    </WithRemoteData>\n);\n"},5525:(e,t,n)=>{"use strict";n.r(t),n.d(t,{default:()=>a});const a="import * as React from 'react';\nimport {\n    InvalidationStrategy,\n    RemoteDataStore,\n    RemoteDataStores,\n    useRemoteDatas,\n    WithRemoteData,\n} from 'use-remote-data';\n\nlet is = new Map<string, number>();\n\nconst freshData = (key: string): Promise<string> =>\n    new Promise((resolve) => {\n        const num = is.get(key) || 0;\n        is.set(key, num + 1);\n        setTimeout(() => resolve(`${key}: ${num}`), 500);\n    });\n\nexport const Component: React.FC = () => {\n    // provide `freshData` function\n    const stores: RemoteDataStores<string, string> = useRemoteDatas(freshData, { invalidation: InvalidationStrategy.refetchAfterMillis(1000) });\n\n  const [wanted, setWanted] = React.useState('a, b,d');\n\n    const parsedWanted: readonly string[] =\n      wanted\n        .split(',')\n        .map((s) => s.trim())\n        .filter((s) => s.length > 0);\n\n    const currentStores: readonly RemoteDataStore<string>[] =\n      stores.getMany(parsedWanted);\n\n    return (\n        <div>\n            Add/remove stores by editing the text, it's split by comma.\n            <input value={wanted} onChange={(e) => setWanted(e.currentTarget.value)} />\n            <div style={{ display: 'flex', justifyContent: 'space-around' }}>\n              <Column rows={currentStores} />\n              <Column rows={currentStores} />\n            </div>\n        </div>\n    );\n};\n\nexport const Column: React.FC<{ rows: readonly RemoteDataStore<string>[] }> = ({ rows }) => {\n    const renderedRows = rows.map((store, idx) => (\n        <WithRemoteData store={store} key={idx}>\n            {(value, isInvalidated) => <p><span style={{ color: isInvalidated ? 'darkgray' : 'black' }}>{value}</span></p>}\n        </WithRemoteData>\n    ));\n    return <div>{renderedRows}</div>;\n};\n"},5550:(e,t,n)=>{"use strict";n.r(t),n.d(t,{Child:()=>d,Component:()=>o});n(6540);var a=n(3541),i=n(4848),s=0;const r=()=>new Promise((e=>{s+=1,setTimeout((()=>e(s)),1e3)})),o=()=>{const e=(0,a.mp)(r,{invalidation:a.Mf.refetchAfterMillis(2e3)});return(0,i.jsxs)("div",{children:[(0,i.jsx)(d,{store:e}),(0,i.jsx)(d,{store:e})]})},d=e=>{let{store:t}=e;return(0,i.jsx)(a.nS,{store:t,children:(e,t)=>(0,i.jsx)("p",{children:(0,i.jsx)("span",{style:{color:t?"darkgray":"black"},children:e})})})}},5588:(e,t,n)=>{"use strict";n.r(t),n.d(t,{default:()=>a});const a="import * as React from 'react';\nimport { InvalidationStrategy, RemoteDataStore, useRemoteData, WithRemoteData } from 'use-remote-data';\n\nvar i = 0;\nconst freshData = (): Promise<number> =>\n    new Promise((resolve) => {\n        i += 1;\n        setTimeout(() => resolve(i), 1000);\n    });\n\nvar j = 0;\nconst failSometimes = (): Promise<number> =>\n    new Promise((resolve, reject) => {\n        j += 1;\n        if (j % 10 === 0) reject(`${j} was dividable by 10`);\n        else resolve(j);\n    });\n\nexport const Component: React.FC = () => {\n    const one = useRemoteData(\n        freshData,\n        { invalidation: InvalidationStrategy.refetchAfterMillis(1000) }\n    );\n    const two = useRemoteData(\n        failSometimes,\n        { invalidation: InvalidationStrategy.refetchAfterMillis(100) })\n    ;\n\n    return <WithRemoteData store={RemoteDataStore.all(one, two)}>\n        {([num1, num2]) => <span>{num1} - {num2}</span>}\n    </WithRemoteData>;\n};\n"},7879:(e,t,n)=>{"use strict";n.d(t,{A:()=>a});const a=n.p+"assets/medias/typesafe-combine-37a96b8d5a32a72484882b73e60806db.webm"},8789:(e,t,n)=>{"use strict";n.r(t),n.d(t,{Component:()=>r});n(6540);var a=n(3541),i=n(4848);function s(e,t){return void 0===t&&(t=1e3),new Promise((n=>setTimeout((()=>n(e)),t)))}const r=()=>{const e=(0,a.mp)((()=>s(1))),t=(0,a.mp)((()=>s("Hello"))),n=a.Qt.all(e,t);return(0,i.jsx)(a.nS,{store:n,children:e=>{let[t,n]=e;return(0,i.jsxs)("span",{children:[t," and ",n]})}})}},8794:(e,t,n)=>{"use strict";n.d(t,{Y:()=>o});var a=n(6289),i=n(6540),s=n(8069),r=n(4848);const o=e=>{let{snippet:t}=e;const o=n(1266)(`./${t}.tsx`).default,{Component:d}=n(250)(`./${t}`),[l,c]=i.useState(0);return(0,r.jsxs)("div",{children:[(0,r.jsx)(s.A,{language:"tsx",children:o}),(0,r.jsxs)("div",{children:[(0,r.jsx)("div",{children:(0,r.jsx)(a.A,{className:"button button--secondary button--sm",onClick:()=>c(l+1),children:0===l?"Run snippet":"Run again"})}),l>0&&(0,r.jsx)("div",{style:{padding:"1em",margin:"1em",backgroundColor:"#b8e092",color:"black"},children:(0,r.jsx)(d,{},l)})]}),(0,r.jsx)("br",{})]})}},8936:(e,t,n)=>{"use strict";n.r(t),n.d(t,{default:()=>a});const a="import * as React from 'react';\nimport { RemoteDataStore, useRemoteData, WithRemoteData } from 'use-remote-data';\n\nfunction produce<T>(value: T, delay: number = 1000): Promise<T> {\n  return new Promise((resolve) => setTimeout(() => resolve(value), delay));\n}\n\nexport const Component: React.FC = () => {\n  const computeOne: RemoteDataStore<number> =\n    useRemoteData(() => produce(1));\n\n  return <WithRemoteData store={computeOne}>\n      {(num: number) => <span>{num}</span>}\n    </WithRemoteData>;\n};\n"},9439:(e,t,n)=>{"use strict";n.r(t),n.d(t,{default:()=>a});const a="import * as React from 'react';\nimport { InvalidationStrategy, useRemoteData, WithRemoteData } from 'use-remote-data';\n\nvar i = 0;\nconst freshData = (): Promise<number> =>\n    new Promise((resolve) => {\n        i += 1;\n        setTimeout(() => resolve(i), 1000);\n    });\n\nexport const Component: React.FC = () => {\n    const [autoRefresh, setAutoRefresh] = React.useState(true);\n    const store = useRemoteData(\n        freshData,\n        { invalidation: autoRefresh ? InvalidationStrategy.refetchAfterMillis(1000) : undefined },\n    );\n\n    return (\n        <div>\n            <label>\n                Autorefresh:\n                <input type=\"checkbox\" onChange={(e) => setAutoRefresh(!autoRefresh)} checked={autoRefresh} />\n            </label>\n            <br />\n            <WithRemoteData store={store}>\n                {(num, isInvalidated) => <span style={{ color: isInvalidated ? 'darkgray' : 'black' }}>{num}</span>}\n            </WithRemoteData>\n        </div>\n    );\n};\n"},9641:(e,t,n)=>{"use strict";n.r(t),n.d(t,{Column:()=>l,Component:()=>d});var a=n(6540),i=n(3541),s=n(4848);let r=new Map;const o=e=>new Promise((t=>{const n=r.get(e)||0;r.set(e,n+1),setTimeout((()=>t(`${e}: ${n}`)),500)})),d=()=>{const e=(0,i.$o)(o,{invalidation:i.Mf.refetchAfterMillis(1e3)}),[t,n]=a.useState("a, b,d"),r=t.split(",").map((e=>e.trim())).filter((e=>e.length>0)),d=e.getMany(r);return(0,s.jsxs)("div",{children:["Add/remove stores by editing the text, it's split by comma.",(0,s.jsx)("input",{value:t,onChange:e=>n(e.currentTarget.value)}),(0,s.jsxs)("div",{style:{display:"flex",justifyContent:"space-around"},children:[(0,s.jsx)(l,{rows:d}),(0,s.jsx)(l,{rows:d})]})]})},l=e=>{let{rows:t}=e;const n=t.map(((e,t)=>(0,s.jsx)(i.nS,{store:e,children:(e,t)=>(0,s.jsx)("p",{children:(0,s.jsx)("span",{style:{color:t?"darkgray":"black"},children:e})})},t)));return(0,s.jsx)("div",{children:n})}}}]);
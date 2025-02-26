"use strict";(self.webpackChunksite=self.webpackChunksite||[]).push([[494],{8744:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>l,contentTitle:()=>r,default:()=>p,frontMatter:()=>o,metadata:()=>i,toc:()=>c});const i=JSON.parse('{"id":"invalidation","title":"Invalidation / Refresh data","description":"Sometimes data becomes out-of-date.","source":"@site/docs/invalidation.mdx","sourceDirName":".","slug":"/invalidation","permalink":"/use-remote-data/docs/invalidation","draft":false,"unlisted":false,"editUrl":"https://github.com/facebook/docusaurus/edit/master/website/docs/invalidation.mdx","tags":[],"version":"current","frontMatter":{},"sidebar":"tutorialSidebar","previous":{"title":"Remote Data pattern","permalink":"/use-remote-data/docs/remote-data-pattern"},"next":{"title":"Combining stores","permalink":"/use-remote-data/docs/combining-stores"}}');var a=t(4848),d=t(8453),s=t(8794);const o={},r="Invalidation / Refresh data",l={},c=[{value:"By time",id:"by-time",level:2},{value:"Only Sometimes?",id:"only-sometimes",level:3},{value:"Poll until valid data",id:"poll-until-valid-data",level:2},{value:"Invalidate on Dependency Change",id:"invalidate-on-dependency-change",level:2}];function h(e){const n={code:"code",h1:"h1",h2:"h2",h3:"h3",header:"header",p:"p",pre:"pre",strong:"strong",...(0,d.R)(),...e.components};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(n.header,{children:(0,a.jsx)(n.h1,{id:"invalidation--refresh-data",children:"Invalidation / Refresh data"})}),"\n",(0,a.jsx)(n.p,{children:"Sometimes data becomes out-of-date."}),"\n",(0,a.jsxs)(n.p,{children:[(0,a.jsx)(n.code,{children:"use-remote-data"})," supports \u201cinvalidation\u201d through an optional ",(0,a.jsx)(n.code,{children:"invalidation: InvalidationStrategy"})," parameter to the hook."]}),"\n",(0,a.jsxs)(n.p,{children:["An ",(0,a.jsx)(n.strong,{children:(0,a.jsx)(n.code,{children:"InvalidationStrategy"})})," is a function that decides whether to keep data or mark it stale."]}),"\n",(0,a.jsx)(n.h2,{id:"by-time",children:"By time"}),"\n",(0,a.jsx)(n.p,{children:"Here is an example where data is considered stale after 2 seconds."}),"\n",(0,a.jsxs)(n.p,{children:["In the ",(0,a.jsx)(n.code,{children:"<WithRemoteData>"})," render prop,\nyou can check the second argument (",(0,a.jsx)(n.code,{children:"isInvalidated"}),")\nto decide whether to let the user see old data or a loading indicator."]}),"\n",(0,a.jsx)(s.Y,{snippet:"invalidation"}),"\n",(0,a.jsx)(n.h3,{id:"only-sometimes",children:"Only Sometimes?"}),"\n",(0,a.jsxs)(n.p,{children:["You can enable or disable invalidation dynamically by swapping the ",(0,a.jsx)(n.code,{children:"invalidation"})," strategy in or out. For instance:"]}),"\n",(0,a.jsx)(s.Y,{snippet:"invalidation_sometimes"}),"\n",(0,a.jsx)(n.h2,{id:"poll-until-valid-data",children:"Poll until valid data"}),"\n",(0,a.jsxs)(n.p,{children:["Something that comes up sometimes is APIs which require you to poll.\n",(0,a.jsx)(n.code,{children:"use-remote-data"})," supports this through ",(0,a.jsx)(n.code,{children:"InvalidationStrategy.pollUntil"})]}),"\n",(0,a.jsx)(s.Y,{snippet:"polling"}),"\n",(0,a.jsx)(n.h2,{id:"invalidate-on-dependency-change",children:"Invalidate on Dependency Change"}),"\n",(0,a.jsxs)(n.p,{children:[(0,a.jsx)(n.code,{children:"useRemoteData"})," and ",(0,a.jsx)(n.code,{children:"useRemoteDatas"})," let you provide a ",(0,a.jsx)(n.code,{children:"dependencies"})," array (similar to React\u2019s ",(0,a.jsx)(n.code,{children:"useEffect"}),"):"]}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-tsx",children:"useRemoteData(() => fetchData(), {\n    dependencies: [props.userId, otherValue],\n});\n"})}),"\n",(0,a.jsxs)(n.p,{children:["When the dependency array changes, the store invalidates automatically, and ",(0,a.jsx)(n.code,{children:"triggerUpdate()"})," will re-fetch if needed.\n(Currently, it compares dependencies by ",(0,a.jsx)(n.code,{children:"JSON.stringify"}),".)"]}),"\n",(0,a.jsx)(s.Y,{snippet:"invalidation_dependencies"})]})}function p(e={}){const{wrapper:n}={...(0,d.R)(),...e.components};return n?(0,a.jsx)(n,{...e,children:(0,a.jsx)(h,{...e})}):h(e)}}}]);
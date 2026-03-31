function b(n){let t=[],e=0,a=n.length,s=()=>n[e],r=()=>n[e++],l=d=>d===" "||d==="	"||d==="\r",i=d=>d===";"||d===`
`,c=()=>e>=a,o=()=>{for(;!c()&&l(s());)r()},u=()=>{r();let d=1,f=e;for(;!c();){let v=r();if(v==="{")d++;else if(v==="}"&&--d===0)break}return n.slice(f,e-1).trim()},p=()=>{r();let d=1,f=e;for(;!c();){let v=r();if(v==="[")d++;else if(v==="]"&&--d===0)break}return b(n.slice(f,e-1).trim())},g=()=>{r();let d="",f=!1;for(;!c()&&!(!f&&s()==='"');){let v=r();if(v==="\\"&&!f){f=!0;continue}if(f){if(f=!1,v==="n"){d+=`
`;continue}if(v==="t"){d+="	";continue}}d+=v}return c()||r(),d},x=()=>{let d="";for(;!c();){let f=s();if(l(f)||i(f)||f==="#"||f==="["||f==="]"||f==="{"||f==="}"||f==='"')break;d+=r()}return d},S=()=>{let d=[];for(;!c()&&(o(),!c());){let f=s();if(i(f)||f==="#")break;f==="{"?d.push(u()):f==="["?d.push(p()):f==='"'?d.push(g()):d.push(x())}return d};for(;!c()&&(o(),!c());){let d=s();if(i(d)){r();continue}if(d==="#"){for(;!c()&&s()!==`
`;)r();continue}let f=S();f.length>0&&t.push(f)}return t}var w=(n=null)=>({vars:{},parent:n}),z=(n,t)=>{let e=n;for(;e;){if(t in e.vars)return String(e.vars[t]);e=e.parent}return null};function T(n,t){return typeof n!="string"?n:n.replace(/\$([a-zA-Z_][a-zA-Z0-9_-]*)/g,(e,a)=>z(t,a)??e)}function m(n,t,e){let a=[];for(let s of n){if(!Array.isArray(s)||s.length===0)continue;let r=typeof s[0]=="string"?s[0]:null;if(!r)continue;let l=e.cmds[r];if(!l){console.error(`Unknown command: ${r}`);continue}let c=s.slice(1).map(u=>Array.isArray(u)?m(u,t,e).join(""):T(u,t)),o=l(c,t);if(o?.__khemReturn)return[o.value??""];o!=null&&a.push(String(o))}return a}function F(n,t){return m(n,w(),t).join("")}var y=n=>n&&n!=="0"&&n!=="false",h=n=>Number(n)||0;function E(n){let t=n.cmds;t.text=e=>e[0]??"",t.set=(e,a)=>(a.vars[e[0]]=e[1]??"",null),t.puts=e=>(console.log(e.join(" ")),null),t.if=(e,a)=>{let[s,r,l,i]=e;return y(s)?m(b(r),a,n):l==="else"&&i?m(b(i),a,n):null},t.for=(e,a)=>{let[s,r,l,i]=e,c=[],o=b(i),u=a.vars[s];for(let p=h(r);p<=h(l);p++)a.vars[s]=String(p),c.push(...m(o,a,n));return u!==void 0?a.vars[s]=u:delete a.vars[s],c},t.foreach=(e,a)=>{let[s,r,l]=e,i=String(r).split(/\s+/).filter(Boolean),c=b(l),o=[],u=a.vars[s];for(let p of i)a.vars[s]=p,o.push(...m(c,a,n));return u!==void 0?a.vars[s]=u:delete a.vars[s],o},t.proc=e=>{let[a,s,r]=e,l=b(r),i=b(s).map(c=>typeof c=="string"?{name:c,default:null}:{name:c[0],default:c[1]??null});return t[a]=(c,o)=>{let u=w(o),p=0;for(let x of i){let S=p<c.length?c[p++]:x.default??"";u.vars[x.name]=S}let g=m(l,u,n);return g.length>0&&g[0]?.__khemReturn?[g[0].value??""]:g},null},t.return=e=>({__khemReturn:!0,value:e[0]??""}),t.list=e=>e.join(" "),t.llength=e=>e[0].split(/\s+/).filter(Boolean).length,t.lindex=e=>e[0].split(/\s+/).filter(Boolean)[h(e[1])]??"",t.lappend=(e,a)=>(a.vars[e[0]]=(a.vars[e[0]]||"")+" "+e.slice(1).join(" "),null),t.concat=e=>e.join(" "),t.join=e=>e.length===2&&e[0].includes(" ")?e[0].split(/\s+/).join(e[1]||" "):e.join(""),t.expr=(e,a)=>{let s=e.join(" ");s=s.replace(/==/g,"===").replace(/!=/g,"!==");try{return String(new Function("return "+s)())}catch{return"0"}},t.incr=(e,a)=>(a.vars[e[0]]=String(h(a.vars[e[0]]||0)+h(e[1]||1)),a.vars[e[0]]),t.abs=e=>String(Math.abs(h(e[0]))),t.round=e=>String(Math.round(h(e[0]))),t.floor=e=>String(Math.floor(h(e[0]))),t.ceil=e=>String(Math.ceil(h(e[0]))),t.sqrt=e=>String(Math.sqrt(h(e[0]))),t.max=e=>String(Math.max(...e.map(h))),t.min=e=>String(Math.min(...e.map(h))),t.string=e=>{let[a,s,...r]=e;switch(a){case"length":return String(s.length);case"index":return s[h(r[0])]||"";case"range":return s.slice(h(r[0]),r[1]?h(r[1])+1:void 0);case"trim":return s.trim();case"toupper":return s.toUpperCase();case"tolower":return s.toLowerCase();case"match":return new RegExp(r[0].replace(/\*/g,".*").replace(/\?/g,".")).test(s)?"1":"0";default:return""}},t.eq=e=>e[0]===e[1]?"1":"0",t.neq=e=>e[0]!==e[1]?"1":"0",t.gt=e=>h(e[0])>h(e[1])?"1":"0",t.lt=e=>h(e[0])<h(e[1])?"1":"0",t.gte=e=>h(e[0])>=h(e[1])?"1":"0",t.lte=e=>h(e[0])<=h(e[1])?"1":"0",t.not=e=>y(e[0])?"0":"1",t.and=e=>y(e[0])&&y(e[1])?"1":"0",t.or=e=>y(e[0])||y(e[1])?"1":"0",t.replace=e=>e[0].replaceAll(e[1],e[2]),t.trim=e=>e[0].trim(),t.upper=e=>e[0].toUpperCase(),t.lower=e=>e[0].toLowerCase(),t.slice=e=>e[0].slice(h(e[1]),e[2]?h(e[2]):void 0),t.contains=e=>e[0].includes(e[1])?"1":"0",t["starts-with"]=e=>e[0].startsWith(e[1])?"1":"0",t["ends-with"]=e=>e[0].endsWith(e[1])?"1":"0",t.today=()=>new Date().toISOString().slice(0,10),t.clock=e=>e[0]==="seconds"?String(Math.floor(Date.now()/1e3)):new Date().toLocaleString(),t.match=(e,a)=>{let s=e[0],r=[];if(e.length===2&&typeof e[1]=="string"){let i=e[1],c=[],o=0;for(;o<i.length;){for(;o<i.length&&/\s/.test(i[o]);)o++;if(o>=i.length)break;let u="";if(i[o]==='"'){for(o++;o<i.length&&i[o]!=='"';)u+=i[o],o++;o<i.length&&o++}else for(;o<i.length&&!/[\s{}]/.test(i[o]);)u+=i[o],o++;for(;o<i.length&&/\s/.test(i[o]);)o++;if(i[o]==="{"){o++;let p=1,g="";for(;o<i.length&&p>0&&(i[o]==="{"&&p++,!(i[o]==="}"&&(p--,p===0)));)g+=i[o],o++;o<i.length&&o++,c.push([u.trim(),g.trim()])}}r=c}else for(let i=1;i<e.length;i++)Array.isArray(e[i])&&e[i].length>=2&&r.push(e[i]);let l=null;for(let[i,c]of r){let o=b(c);if(i==="default"){l=o;continue}if(i===s)return m(o,a,n)}return l?m(l,a,n):null},t.try=(e,a)=>{try{return m(b(e[0]),a,n)}catch(s){let r=a.vars.error;if(e[1]==="catch"&&e[2])return a.vars.error=s.message,m(b(e[2]),a,n);throw r!==void 0?a.vars.error=r:delete a.vars.error,s}},t.throw=e=>{throw new Error(e[0])},t.dict=e=>{let[a,...s]=e;switch(a){case"create":{let r=[];for(let l=0;l<s.length;l+=2)r.push(s[l],s[l+1]||"");return r.join(" ")}case"get":{let r=s[0].split(/\s+/);for(let l=0;l<r.length;l+=2)if(r[l]===s[1])return r[l+1];return""}case"set":{let r=s[0]?s[0].split(/\s+/):[],l=s[1],i=s[2],c=!1;for(let o=0;o<r.length;o+=2)if(r[o]===l){r[o+1]=i,c=!0;break}return c||r.push(l,i),r.join(" ")}default:return""}}}var L=`:root {
  --bg: #0a0a0a;
  --s0: #101010;
  --s1: #161616;
  --s2: #1e1e1e;
  --s3: #262626;
  --border: #272727;
  --b2: #333333;
  --fg: #d4d0c8;
  --fg1: #aaaaaa;
  --fg2: #888888;
  --fg3: #555555;
  --dim: #484848;
  --acc: #c8a84b;
  --acc-dim: #7a6628;
  --green: #6b9e78;
  --green-dim: #2a4a33;
  --red: #a86b6b;
  --red-dim: #4a2222;
  --blue: #7a8fa8;
  --blue-dim: #2a3a4a;
  --amber: #d4924a;
  --mono: 'DM Mono', 'Fira Mono', ui-monospace, monospace;
  --serif: 'Instrument Serif', Georgia, serif;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { height: 100%; }
body {
  background: var(--bg);
  color: var(--fg);
  font-family: var(--mono);
  font-size: 12px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  padding: 24px;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}
#app {
  width: 100%;
  max-width: 800px;
}
*::-webkit-scrollbar { width: 6px; height: 6px; }
*::-webkit-scrollbar-track { background: var(--bg); }
*::-webkit-scrollbar-thumb { background: var(--border); }
*::-webkit-scrollbar-thumb:hover { background: var(--b2); }
h1, h2, h3 { font-family: var(--serif); font-weight: normal; }
h4, h5, h6 { font-family: var(--mono); font-weight: 500; }
p { color: var(--fg1); }
a { color: var(--acc); text-decoration: none; }
a:hover { text-decoration: underline; }
code { color: var(--acc); font-size: 10.5px; }
button {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--fg2);
  padding: 4px 12px;
  cursor: pointer;
  font-family: inherit;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  transition: all 0.15s;
}
button:hover { border-color: var(--b2); color: var(--fg); }
button.primary { border-color: var(--acc); color: var(--acc); }
button.primary:hover { border-color: var(--acc); color: var(--fg); }
button.danger:hover { border-color: var(--red); color: var(--red); }
.field {
  background: var(--s1);
  border: 1px solid var(--border);
  color: var(--fg);
  padding: 8px 10px;
  font-family: inherit;
  font-size: 12px;
  outline: none;
  transition: all 0.15s;
}
.field:focus { border-color: var(--acc); }
.field::placeholder { color: var(--fg3); }
textarea.field { resize: vertical; min-height: 60px; }
select.field { cursor: pointer; }
.badge {
  font-size: 9.5px;
  padding: 1px 6px;
  border: 1px solid;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
}
.dot.active { background: var(--acc); }
.dot.done { background: var(--green); }
.dot.blocked { background: var(--red); }
.dot.idle { background: var(--border); }
.panel {
  border: 1px solid var(--border);
  background: var(--s1);
  padding: 1rem;
}
.modal {
  border: 1px solid var(--border);
  background: var(--s2);
  padding: 12px;
}
.toast {
  border: 1px solid var(--green-dim);
  background: var(--green-dim);
  color: var(--green);
  padding: 6px 10px;
  display: inline-flex;
}
.table { width: 100%; border-collapse: collapse; }
.table th, .table td {
  border-bottom: 1px solid var(--border);
  padding: 6px 8px;
  text-align: left;
}
.table th { color: var(--fg2); font-weight: normal; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.08em; }
`,O="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Instrument+Serif:ital@0;1&display=swap";var j=null,k=null;function C(){return typeof process<"u"&&process.versions!=null&&process.versions.node!=null}C()&&Promise.all([import("node:fs").catch(()=>null),import("node:path").catch(()=>null)]).then(([n,t])=>{n&&(j=n.default??n),t&&(k=t.default??t)});var D=n=>(n._web||(n._web={title:"Khem App",pages:{},routes:{},styles:[],scripts:[],includes:new Set}),n._web),_=(n,t,e)=>{if(typeof n!="string")throw new Error("RenderWeb: source must be a string");return m(b(n),t,e).join("")};function R(n,t,e){return Array.isArray(n)?n.length>0&&typeof n[0]=="string"?m([n],t,e).join(""):m(n,t,e).join(""):typeof n=="string"?_(n,t,e):String(n??"")}function $(n,t,e){if(n.length===0)throw new Error("tag expects at least 1 argument");let a=typeof n[0]=="string"&&n.length>1&&!Array.isArray(n[0]),s=a?n[0]:"",l=(a?n.slice(1):n).map(i=>R(i,t,e)).join("");return{cls:s?` class="${s}"`:"",body:l}}function M(n){let t=n.cmds,e=D(n);t.tag=(r,l)=>{let i=r[0]??"div",{cls:c,body:o}=$(r.slice(1),l,n);return`<${i}${c}>${o}</${i}>`},["br","hr","img","input","meta","link"].forEach(r=>{t[r]=()=>`<${r}>`}),["div","span","p","h1","h2","h3","h4","h5","h6","ul","ol","li","table","tr","td","th","section","main","header","footer","nav","article","form","label","pre","code","blockquote","strong","em","button"].forEach(r=>{t[r]=(l,i)=>{let{cls:c,body:o}=$(l,i,n);return`<${r}${c}>${o}</${r}>`}}),t.a=(r,l)=>{let i=r[0]??"#",{cls:c,body:o}=$(r.slice(1),l,n);return`<a href="${i}"${c}>${o}</a>`},t.img=([r="",l=""])=>`<img src="${r}" alt="${l}">`,t.input=r=>{let l="",i="field",c="";r.length===1?c=r[0]:r.length===2?(i=r[0],c=r[1]):r.length>=3&&(l=r[0],i=r[1],c=r[2]);let o=c?b(c).map(([u,...p])=>p.length?`${u}="${p.join(" ")}"`:u).join(" "):"";return`<input${l?` id="${l}"`:""}${i?` class="${i}"`:""}${o?` ${o}`:""}>`},t.title=([r])=>{e.title=r??"Khem App"},t.page=([r,l])=>{e.pages[r]=l??""},t.route=([r,l])=>{e.routes[r]=l},t.document=([r,l])=>{r&&(e.title=r),e.pages.__doc__=l??"",e.routes["#/"]="__doc__"},t.style=([r])=>{if(!r)return;let l={vars:{...n.vars},parent:null},i=o=>Array.isArray(o)?m(o,l,n).join(""):String(o),c=(o,u="")=>b(o).map(p=>{let g=p[p.length-1];return typeof g=="string"&&/[;\n]/.test(g)?`${u}${p.slice(0,-1).map(i).join(" ")} { 
${c(g,u+"  ")}${u}}`:`${u}${i(p[0])}: ${p.slice(1).map(i).join(" ")};`}).join(`
`)+`
`;e.styles.push(c(r))},t.script=([r])=>{r&&e.scripts.push(r)},t.text=([r])=>r??"",t.include=([r],l)=>{if(!r)return;if(!C()){console.warn(`include "${r}" skipped \u2014 browser`);return}if(!j||!k){console.error(`include "${r}" skipped \u2014 no fs`);return}let i=n._baseDir??process.cwd(),c=k.resolve(i,r);if(e.includes.has(c))return;e.includes.add(c);let o=n._baseDir;try{n._baseDir=k.dirname(c),_(j.readFileSync(c,"utf8"),l,n)}catch(u){console.error(`include error: ${u.message}`)}finally{n._baseDir=o}}}function N(n){let t=D(n),e={};for(let[u,p]of Object.entries(t.pages)){let g={vars:{...n.vars},parent:null};e[u]=_(p,g,n)}let a=Object.keys(e),s=t.routes["#/"]??a[0],r=e[s]??"",i=a.length>1?`
    var T=${JSON.stringify(e)};
    var R=${JSON.stringify(t.routes)};
    function route(){
      var p=R[location.hash||"#/"]||Object.keys(T)[0];
      if(p&&T[p])document.getElementById("app").innerHTML=T[p];
    }
    window.addEventListener("hashchange",route);route();`:"",c=t.styles.join(`
`),o=t.scripts.join(`
`);return`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.title}</title>
  <link href="${O}" rel="stylesheet">
  <style>
    ${L}
    ${c}
  </style>
</head>
<body>
  <div id="app">${r}</div>
  <script>
    ${i}
    ${o}
  <\/script>
</body>
</html>`}function A(n=!1){let t={cmds:{},vars:{}};return E(t),n&&M(t),t}function X(n,t=A()){return m(b(n),{vars:t.vars,parent:null},t).join("")}function ee(n,t){let e=A(!0);t&&(e._baseDir=t);let a={vars:e.vars,parent:null},s=m(b(n),a,e).join(""),r=N(e);return r&&r.trim()?r:s}function te(n){let t=A(!0);return n.replace(/<script\s+type="text\/khem"[^>]*>([\s\S]*?)<\/script>/gi,(e,a)=>{try{let s={vars:t.vars,parent:null};return m(b(a.trim()),s,t).join("")}catch(s){return console.error("Khem script error:",s),`<!-- Error: ${s.message} -->`}})}export{A as createEnvironment,w as createScope,m as evaluate,b as parse,te as processScriptTags,F as render,ee as renderForWeb,X as run,T as sub};

function b(n){let e=[],t=0,a=n.length,r=()=>n[t],o=()=>n[t++],c=d=>d===" "||d==="	"||d==="\r",i=d=>d===";"||d===`
`,l=()=>t>=a,s=()=>{for(;!l()&&c(r());)o()},u=()=>{o();let d=1,f=t;for(;!l();){let v=o();if(v==="{")d++;else if(v==="}"&&--d===0)break}return n.slice(f,t-1).trim()},h=()=>{o();let d=1,f=t;for(;!l();){let v=o();if(v==="[")d++;else if(v==="]"&&--d===0)break}return b(n.slice(f,t-1).trim())},g=()=>{o();let d="";for(;!l()&&r()!=='"';){let f=o();d+=f==="\\"&&!l()?o():f}return l()||o(),d},k=()=>{let d="";for(;!l();){let f=r();if(c(f)||i(f)||f==="#"||f==="["||f==="]"||f==="{"||f==="}"||f==='"')break;d+=o()}return d},S=()=>{let d=[];for(;!l()&&(s(),!l());){let f=r();if(i(f)||f==="#")break;f==="{"?d.push(u()):f==="["?d.push(h()):f==='"'?d.push(g()):d.push(k())}return d};for(;!l()&&(s(),!l());){let d=r();if(i(d)){o();continue}if(d==="#"){for(;!l()&&r()!==`
`;)o();continue}let f=S();f.length>0&&e.push(f)}return e}var x=(n=null)=>({vars:{},parent:n}),z=(n,e)=>{let t=n;for(;t;){if(e in t.vars)return String(t.vars[e]);t=t.parent}return null};function E(n,e){return typeof n!="string"?n:n.replace(/\$([a-zA-Z_][a-zA-Z0-9_-]*)/g,(t,a)=>z(e,a)??t)}function m(n,e,t){let a=[];for(let r of n){if(!Array.isArray(r)||r.length===0)continue;let o=typeof r[0]=="string"?r[0]:null;if(!o)continue;let c=t.cmds[o];if(!c){console.error(`Unknown command: ${o}`);continue}let l=r.slice(1).map(u=>Array.isArray(u)?m(u,e,t).join(""):E(u,e)),s=c(l,e);if(s?.__khemReturn)return[s.value??""];s!=null&&a.push(String(s))}return a}function F(n,e){return m(n,x(),e).join("")}var y=n=>n&&n!=="0"&&n!=="false",p=n=>Number(n)||0;function L(n){let e=n.cmds;e.text=t=>t[0]??"",e.set=(t,a)=>(a.vars[t[0]]=t[1]??"",null),e.puts=t=>(console.log(t.join(" ")),null),e.if=(t,a)=>{let[r,o,c,i]=t;return y(r)?m(b(o),a,n):c==="else"&&i?m(b(i),a,n):null},e.for=(t,a)=>{let[r,o,c,i]=t,l=[],s=b(i),u=a.vars[r];for(let h=p(o);h<=p(c);h++)a.vars[r]=String(h),l.push(...m(s,a,n));return u!==void 0?a.vars[r]=u:delete a.vars[r],l},e.foreach=(t,a)=>{let[r,o,c]=t,i=String(o).split(/\s+/).filter(Boolean),l=b(c),s=[],u=a.vars[r];for(let h of i)a.vars[r]=h,s.push(...m(l,a,n));return u!==void 0?a.vars[r]=u:delete a.vars[r],s},e.proc=t=>{let[a,r,o]=t,c=b(o),i=b(r).map(l=>typeof l=="string"?{name:l,default:null}:{name:l[0],default:l[1]??null});return e[a]=(l,s)=>{let u=x(s),h=0;for(let k of i){let S=h<l.length?l[h++]:param.default??"";u.vars[k.name]=S}let g=m(c,u,n);return g.length>0&&g[0]?.__khemReturn?[g[0].value??""]:g},null},e.return=t=>({__khemReturn:!0,value:t[0]??""}),e.list=t=>t.join(" "),e.llength=t=>t[0].split(/\s+/).filter(Boolean).length,e.lindex=t=>t[0].split(/\s+/).filter(Boolean)[p(t[1])]??"",e.lappend=(t,a)=>(a.vars[t[0]]=(a.vars[t[0]]||"")+" "+t.slice(1).join(" "),null),e.concat=t=>t.join(" "),e.join=t=>t.length===2&&t[0].includes(" ")?t[0].split(/\s+/).join(t[1]||" "):t.join(""),e.expr=(t,a)=>{let r=t.join(" ");r=r.replace(/==/g,"===").replace(/!=/g,"!==");try{return String(new Function("return "+r)())}catch{return"0"}},e.incr=(t,a)=>(a.vars[t[0]]=String(p(a.vars[t[0]]||0)+p(t[1]||1)),a.vars[t[0]]),e.abs=t=>String(Math.abs(p(t[0]))),e.round=t=>String(Math.round(p(t[0]))),e.floor=t=>String(Math.floor(p(t[0]))),e.ceil=t=>String(Math.ceil(p(t[0]))),e.sqrt=t=>String(Math.sqrt(p(t[0]))),e.max=t=>String(Math.max(...t.map(p))),e.min=t=>String(Math.min(...t.map(p))),e.string=t=>{let[a,r,...o]=t;switch(a){case"length":return String(r.length);case"index":return r[p(o[0])]||"";case"range":return r.slice(p(o[0]),o[1]?p(o[1])+1:void 0);case"trim":return r.trim();case"toupper":return r.toUpperCase();case"tolower":return r.toLowerCase();case"match":return new RegExp(o[0].replace(/\*/g,".*").replace(/\?/g,".")).test(r)?"1":"0";default:return""}},e.eq=t=>t[0]===t[1]?"1":"0",e.neq=t=>t[0]!==t[1]?"1":"0",e.gt=t=>p(t[0])>p(t[1])?"1":"0",e.lt=t=>p(t[0])<p(t[1])?"1":"0",e.gte=t=>p(t[0])>=p(t[1])?"1":"0",e.lte=t=>p(t[0])<=p(t[1])?"1":"0",e.not=t=>y(t[0])?"0":"1",e.and=t=>y(t[0])&&y(t[1])?"1":"0",e.or=t=>y(t[0])||y(t[1])?"1":"0",e.replace=t=>t[0].replaceAll(t[1],t[2]),e.trim=t=>t[0].trim(),e.upper=t=>t[0].toUpperCase(),e.lower=t=>t[0].toLowerCase(),e.slice=t=>t[0].slice(p(t[1]),t[2]?p(t[2]):void 0),e.contains=t=>t[0].includes(t[1])?"1":"0",e["starts-with"]=t=>t[0].startsWith(t[1])?"1":"0",e["ends-with"]=t=>t[0].endsWith(t[1])?"1":"0",e.today=()=>new Date().toISOString().slice(0,10),e.clock=t=>t[0]==="seconds"?String(Math.floor(Date.now()/1e3)):new Date().toLocaleString(),e.match=(t,a)=>{let r=t[0],o=[];if(t.length===2&&typeof t[1]=="string"){let i=t[1],l=[],s=0;for(;s<i.length;){for(;s<i.length&&/\s/.test(i[s]);)s++;if(s>=i.length)break;let u="";if(i[s]==='"'){for(s++;s<i.length&&i[s]!=='"';)u+=i[s],s++;s<i.length&&s++}else for(;s<i.length&&!/[\s{}]/.test(i[s]);)u+=i[s],s++;for(;s<i.length&&/\s/.test(i[s]);)s++;if(i[s]==="{"){s++;let h=1,g="";for(;s<i.length&&h>0&&(i[s]==="{"&&h++,!(i[s]==="}"&&(h--,h===0)));)g+=i[s],s++;s<i.length&&s++,l.push([u.trim(),g.trim()])}}o=l}else for(let i=1;i<t.length;i++)Array.isArray(t[i])&&t[i].length>=2&&o.push(t[i]);let c=null;for(let[i,l]of o){let s=b(l);if(i==="default"){c=s;continue}if(i===r)return m(s,a,n)}return c?m(c,a,n):null},e.try=(t,a)=>{try{return m(b(t[0]),a,n)}catch(r){let o=a.vars.error;if(t[1]==="catch"&&t[2])return a.vars.error=r.message,m(b(t[2]),a,n);throw o!==void 0?a.vars.error=o:delete a.vars.error,r}},e.throw=t=>{throw new Error(t[0])},e.dict=t=>{let[a,...r]=t;switch(a){case"create":{let o=[];for(let c=0;c<r.length;c+=2)o.push(r[c],r[c+1]||"");return o.join(" ")}case"get":{let o=r[0].split(/\s+/);for(let c=0;c<o.length;c+=2)if(o[c]===r[1])return o[c+1];return""}case"set":{let o=r[0]?r[0].split(/\s+/):[],c=r[1],i=r[2],l=!1;for(let s=0;s<o.length;s+=2)if(o[s]===c){o[s+1]=i,l=!0;break}return l||o.push(c,i),o.join(" ")}default:return""}}}var T=`:root {
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
`,O="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Instrument+Serif:ital@0;1&display=swap";var j=null,w=null;function C(){return typeof process<"u"&&process.versions!=null&&process.versions.node!=null}C()&&Promise.all([import("node:fs").catch(()=>null),import("node:path").catch(()=>null)]).then(([n,e])=>{n&&(j=n.default??n),e&&(w=e.default??e)});var D=n=>(n._web||(n._web={title:"Khem App",pages:{},routes:{},styles:[],scripts:[],includes:new Set}),n._web),_=(n,e,t)=>{if(typeof n!="string")throw new Error("RenderWeb: source must be a string");return m(b(n),e,t).join("")};function R(n,e,t){return Array.isArray(n)?n.length>0&&typeof n[0]=="string"?m([n],e,t).join(""):m(n,e,t).join(""):typeof n=="string"?_(n,e,t):String(n??"")}function $(n,e,t){if(n.length===0)throw new Error("tag expects at least 1 argument");let a=typeof n[0]=="string"&&n.length>1&&!Array.isArray(n[0]),r=a?n[0]:"",c=(a?n.slice(1):n).map(i=>R(i,e,t)).join("");return{cls:r?` class="${r}"`:"",body:c}}function M(n){let e=n.cmds,t=D(n),a=r=>(o,c)=>{let{cls:i,body:l}=$(o,c,n);return`<${r}${i}>${l}</${r}>`};e.title=([r])=>{t.title=r??"Khem App"},e.page=([r,o])=>{t.pages[r]=o??""},e.route=([r,o])=>{t.routes[r]=o},e.style=([r])=>{if(!r)return;let o={vars:{...n.vars},parent:null},c=l=>Array.isArray(l)?m(l,o,n).join(""):String(l),i=(l,s="")=>b(l).map(u=>{let h=u[u.length-1];return typeof h=="string"&&/[;\n]/.test(h)?`${s}${u.slice(0,-1).map(c).join(" ")} { 
${i(h,s+"  ")}${s}}`:`${s}${c(u[0])}: ${u.slice(1).map(c).join(" ")};`}).join(`
`)+`
`;t.styles.push(i(r))},e.script=([r])=>{r&&t.scripts.push(r)},e.text=([r])=>r??"",e.document=([r,o])=>{r&&(t.title=r),t.pages.__doc__=o??"",t.routes["#/"]="__doc__"},e.include=([r],o)=>{if(!r)return;if(!C()){console.warn(`include "${r}" skipped \u2014 filesystem not available in browser`);return}if(!j||!w){console.error(`include "${r}" skipped \u2014 Node builtins not yet initialised`);return}let c=n._baseDir??process.cwd(),i=w.resolve(c,r);if(t.includes.has(i))return;t.includes.add(i);let l=n._baseDir;try{n._baseDir=w.dirname(i),_(j.readFileSync(i,"utf8"),o,n)}catch(s){console.error(`include error: ${s.message}`)}finally{n._baseDir=l}},["div","span","p","h1","h2","h3","h4","h5","h6","ul","ol","li","table","tr","td","th","section","main","header","footer","nav","article","form","label","pre","code","blockquote","strong","em"].forEach(r=>{e[r]=a(r)}),e.a=(r,o)=>{let c=r[0]??"#",{cls:i,body:l}=$(r.slice(1),o,n);return`<a href="${c}"${i}>${l}</a>`},e.button=(r,o)=>{let{cls:c,body:i}=$(r,o,n);return`<button${c}>${i}</button>`},e.input=r=>{let o="",c="field",i="";r.length===1?i=r[0]:r.length===2?(c=r[0],i=r[1]):r.length>=3&&(o=r[0],c=r[1],i=r[2]);let l=i?b(i).map(([s,...u])=>u.length?`${s}="${u.join(" ")}"`:s).join(" "):"";return`<input${o?` id="${o}"`:""}${c?` class="${c}"`:""}${l?` ${l}`:""}>`},e.br=()=>"<br>",e.hr=()=>"<hr>",e.img=([r="",o=""])=>`<img src="${r}" alt="${o}">`}function N(n){let e=D(n),t={};for(let[u,h]of Object.entries(e.pages)){let g={vars:{...n.vars},parent:null};t[u]=_(h,g,n)}let a=Object.keys(t),r=e.routes["#/"]??a[0],o=t[r]??"",i=a.length>1?`
    var T=${JSON.stringify(t)};
    var R=${JSON.stringify(e.routes)};
    function route(){
      var p=R[location.hash||"#/"]||Object.keys(T)[0];
      if(p&&T[p])document.getElementById("app").innerHTML=T[p];
    }
    window.addEventListener("hashchange",route);route();`:"",l=e.styles.join(`
`),s=e.scripts.join(`
`);return`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${e.title}</title>
  <link href="${O}" rel="stylesheet">
  <style>
    ${T}
    ${l}
  </style>
</head>
<body>
  <div id="app">${o}</div>
  <script>
    ${i}
    ${s}
  <\/script>
</body>
</html>`}function A(n=!1){let e={cmds:{},vars:{}};return L(e),n&&M(e),e}function X(n,e=A()){return m(b(n),{vars:e.vars,parent:null},e).join("")}function tt(n,e){let t=A(!0);e&&(t._baseDir=e);let a={vars:t.vars,parent:null},r=m(b(n),a,t).join(""),o=N(t);return o&&o.trim()?o:r}function et(n){let e=A(!0);return n.replace(/<script\s+type="text\/khem"[^>]*>([\s\S]*?)<\/script>/gi,(t,a)=>{try{let r={vars:e.vars,parent:null};return m(b(a.trim()),r,e).join("")}catch(r){return console.error("Khem script error:",r),`<!-- Error: ${r.message} -->`}})}export{A as createEnvironment,x as createScope,m as evaluate,b as parse,et as processScriptTags,F as render,tt as renderForWeb,X as run,E as sub};

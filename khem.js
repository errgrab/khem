function y(e){let r=[],i=0,m=e.length,f=()=>e[i],t=()=>e[i++],o=u=>u===" "||u==="	"||u==="\r",s=u=>u===";"||u===`
`,n=()=>i>=m,a=()=>{for(;!n()&&o(f());)t()},l=()=>{t();let u=1,p=i;for(;!n();){let g=t();if(g==="{")u++;else if(g==="}"&&--u===0)break}return e.slice(p,i-1).trim()},d=()=>{t();let u=1,p=i;for(;!n();){let g=t();if(g==="[")u++;else if(g==="]"&&--u===0)break}return y(e.slice(p,i-1).trim())},c=()=>{t();let u="",p=!1;for(;!n()&&!(!p&&f()==='"');){let g=t();if(g==="\\"&&!p){p=!0;continue}if(p){if(p=!1,g==="n"){u+=`
`;continue}if(g==="t"){u+="	";continue}if(g==="$"){u+="";continue}}u+=g}return n()||t(),u},$=()=>{let u="";for(;!n();){let p=f();if(o(p)||s(p)||p==="#"||p==="["||p==="]"||p==="{"||p==="}"||p==='"')break;u+=t()}return u},b=()=>{let u=[];for(;!n()&&(a(),!n());){let p=f();if(s(p)||p==="#")break;p==="{"?u.push(l()):p==="["?u.push(d()):p==='"'?u.push(c()):u.push($())}return u};for(;!n()&&(a(),!n());){let u=f();if(s(u)){t();continue}if(u==="#"){for(;!n()&&f()!==`
`;)t();continue}let p=b();p.length>0&&r.push(p)}return r}var w=(e=null)=>({vars:{},parent:e}),O=(e,r)=>{let i=e;for(;i;){if(r in i.vars)return String(i.vars[r]);i=i.parent}return null};function x(e,r){return typeof e!="string"?e:e.replace(/\$([a-zA-Z_][a-zA-Z0-9_-]*)/g,(i,m)=>O(r,m)??i).replace(/\x01/g,"$")}function _(e,r,i){let m=[],f=i.sub??x;for(let t of e){if(!Array.isArray(t)||t.length===0)continue;let o=typeof t[0]=="string"?t[0]:null;if(!o)continue;let s=i.cmds[o];if(!s){console.error(`Unknown command: ${o}`);continue}let a=t.slice(1).map(d=>Array.isArray(d)?_(d,r,i).join(""):f(d,r)),l=s(a,r);if(l?.__khemReturn)return[l.value??""];l!=null&&m.push(String(l))}return m}function C(e,r){return _(e,w(),r).join("")}var S=e=>e&&e!=="0"&&e!=="false",h=e=>Number(e)||0;function j(e){let r=e.cmds;r.text=t=>t[0]??"",r.set=(t,o)=>(o.vars[t[0]]=t[1]??"",null),r.puts=t=>(console.log(t.join(" ")),null),r.if=(t,o)=>{let[s,n,a,l]=t;return S(s)?_(y(n),o,e):a==="else"&&l?_(y(l),o,e):null},r.for=(t,o)=>{let[s,n,a,l]=t,d=[],c=y(l),$=o.vars[s];for(let b=h(n);b<=h(a);b++)o.vars[s]=String(b),d.push(..._(c,o,e));return $!==void 0?o.vars[s]=$:delete o.vars[s],d},r.foreach=(t,o)=>{let[s,n,a]=t,l=String(n).split(/\s+/).filter(Boolean),d=y(a),c=[],$=o.vars[s];for(let b of l)o.vars[s]=b,c.push(..._(d,o,e));return $!==void 0?o.vars[s]=$:delete o.vars[s],c},r.proc=t=>{let[o,s,n]=t,a=y(n),l=y(s).map(d=>typeof d=="string"?{name:d,default:null}:{name:d[0],default:d[1]??null});return r[o]=(d,c)=>{let $=w(c),b=0;for(let p of l){let g=b<d.length?d[b++]:p.default??"";$.vars[p.name]=g}let u=_(a,$,e);return u.length>0&&u[0]?.__khemReturn?[u[0].value??""]:u},null},r.return=t=>({__khemReturn:!0,value:t[0]??""}),r.list=t=>t.join(" "),r.llength=t=>t[0].split(/\s+/).filter(Boolean).length,r.lindex=t=>t[0].split(/\s+/).filter(Boolean)[h(t[1])]??"",r.lappend=(t,o)=>(o.vars[t[0]]=(o.vars[t[0]]||"")+" "+t.slice(1).join(" "),null),r.concat=t=>t.join(" "),r.join=t=>t.length===2&&t[0].includes(" ")?t[0].split(/\s+/).join(t[1]||" "):t.join(""),r.expr=(t,o)=>{let s=t.join(" ");s=s.replace(/==/g,"===").replace(/!=/g,"!==");try{return String(new Function("return "+s)())}catch{return"0"}},r.incr=(t,o)=>(o.vars[t[0]]=String(h(o.vars[t[0]]||0)+h(t[1]||1)),o.vars[t[0]]),r.abs=t=>String(Math.abs(h(t[0]))),r.round=t=>String(Math.round(h(t[0]))),r.floor=t=>String(Math.floor(h(t[0]))),r.ceil=t=>String(Math.ceil(h(t[0]))),r.sqrt=t=>String(Math.sqrt(h(t[0]))),r.max=t=>String(Math.max(...t.map(h))),r.min=t=>String(Math.min(...t.map(h))),r.string=t=>{let[o,s,...n]=t;switch(o){case"length":return String(s.length);case"index":return s[h(n[0])]||"";case"range":return s.slice(h(n[0]),n[1]?h(n[1])+1:void 0);case"trim":return s.trim();case"toupper":return s.toUpperCase();case"tolower":return s.toLowerCase();case"match":return new RegExp(n[0].replace(/\*/g,".*").replace(/\?/g,".")).test(s)?"1":"0";default:return""}},r.eq=t=>t[0]===t[1]?"1":"0",r.neq=t=>t[0]!==t[1]?"1":"0",r.gt=t=>h(t[0])>h(t[1])?"1":"0",r.lt=t=>h(t[0])<h(t[1])?"1":"0",r.gte=t=>h(t[0])>=h(t[1])?"1":"0",r.lte=t=>h(t[0])<=h(t[1])?"1":"0",r.not=t=>S(t[0])?"0":"1",r.and=t=>S(t[0])&&S(t[1])?"1":"0",r.or=t=>S(t[0])||S(t[1])?"1":"0",r.replace=t=>t[0].replaceAll(t[1],t[2]),r.trim=t=>t[0].trim(),r.upper=t=>t[0].toUpperCase(),r.lower=t=>t[0].toLowerCase(),r.slice=t=>t[0].slice(h(t[1]),t[2]?h(t[2]):void 0),r.contains=t=>t[0].includes(t[1])?"1":"0",r["starts-with"]=t=>t[0].startsWith(t[1])?"1":"0",r["ends-with"]=t=>t[0].endsWith(t[1])?"1":"0",r.today=()=>new Date().toISOString().slice(0,10),r.clock=t=>t[0]==="seconds"?String(Math.floor(Date.now()/1e3)):new Date().toLocaleString(),r.match=(t,o)=>{let s=t[0],n=[];if(t.length===2&&typeof t[1]=="string"){let l=t[1],d=[],c=0;for(;c<l.length;){for(;c<l.length&&/\s/.test(l[c]);)c++;if(c>=l.length)break;let $="";if(l[c]==='"'){for(c++;c<l.length&&l[c]!=='"';)$+=l[c],c++;c<l.length&&c++}else for(;c<l.length&&!/[\s{}]/.test(l[c]);)$+=l[c],c++;for(;c<l.length&&/\s/.test(l[c]);)c++;if(l[c]==="{"){c++;let b=1,u="";for(;c<l.length&&b>0&&(l[c]==="{"&&b++,!(l[c]==="}"&&(b--,b===0)));)u+=l[c],c++;c<l.length&&c++,d.push([$.trim(),u.trim()])}}n=d}else for(let l=1;l<t.length;l++)Array.isArray(t[l])&&t[l].length>=2&&n.push(t[l]);let a=null;for(let[l,d]of n){let c=y(d);if(l==="default"){a=c;continue}if(l===s)return _(c,o,e)}return a?_(a,o,e):null},r.try=(t,o)=>{try{return _(y(t[0]),o,e)}catch(s){let n=o.vars.error;if(t[1]==="catch"&&t[2])return o.vars.error=s.message,_(y(t[2]),o,e);throw n!==void 0?o.vars.error=n:delete o.vars.error,s}},r.throw=t=>{throw new Error(t[0])},r.dict=t=>{let[o,...s]=t;switch(o){case"create":{let n=[];for(let a=0;a<s.length;a+=2)n.push(s[a],s[a+1]||"");return n.join(" ")}case"get":{let n=s[0].split(/\s+/);for(let a=0;a<n.length;a+=2)if(n[a]===s[1])return n[a+1];return""}case"set":{let n=s[0]?s[0].split(/\s+/):[],a=s[1],l=s[2],d=!1;for(let c=0;c<n.length;c+=2)if(n[c]===a){n[c+1]=l,d=!0;break}return d||n.push(a,l),n.join(" ")}default:return""}};let i=null,m=null,f=()=>typeof process<"u"&&process.versions?.node!=null;f()&&Promise.all([import("node:fs").catch(()=>null),import("node:path").catch(()=>null)]).then(([t,o])=>{t&&(i=t.default??t),o&&(m=o.default??o)}),r.include=([t],o)=>{if(!t)return;if(!f()){console.warn(`include "${t}" skipped \u2014 browser`);return}if(!i||!m){console.error(`include "${t}" skipped \u2014 no fs`);return}let s=e._baseDir??process.cwd(),n=m.resolve(s,t);if(e._includes||(e._includes=new Set),e._includes.has(n))return;e._includes.add(n);let a=e._baseDir;try{e._baseDir=m.dirname(n);let l=i.readFileSync(n,"utf8");_(y(l),o,e)}catch(l){console.error(`include error: ${l.message}`)}finally{e._baseDir=a}}}function L(e,r){let i=f=>Array.isArray(f)?_(f,{vars:r.vars,parent:null},r).join(""):String(f),m=(f,t="")=>y(f).map(o=>{let s=o[o.length-1];return typeof s=="string"&&/[;\n]/.test(s)?`${t}${o.slice(0,-1).map(i).join(" ")} { 
${m(s,t+"  ")}${t}}`:`${t}${i(o[0])}: ${o.slice(1).map(i).join(" ")};`}).join(`
`)+`
`;return m(e)}function J(e,r,i){let m=[];for(let f=0;f<e.length;f++){let t=e[f];if(!Array.isArray(t)||t.length===0)continue;let o=t[0],s=t.slice(1);if(o==="set"){let n=typeof s[0]=="string"?s[0]:"",l=(i&&i[f]?i[f]:t).slice(1);if(s[1]==="expr"&&typeof s[2]=="string"){let c=(typeof l[2]=="string"?l[2]:s[2]).replace(/\$([a-zA-Z_][a-zA-Z0-9_-]*)/g,($,b)=>`Number(__s[${JSON.stringify(b)}])`);m.push(`__set(${JSON.stringify(n)}, (function(){try{return String(eval(${JSON.stringify(c)}))}catch{return "0"}})())`)}else{let d=s[1],c=typeof d=="string"?JSON.stringify(d):'""';m.push(`__set(${JSON.stringify(n)}, ${c})`)}}else{let n=s.map(a=>typeof a=="string"?JSON.stringify(a):'""');m.push(`__cmd(${JSON.stringify(o)}, ${n.join(", ")})`)}}return m.join("; ")}function A(e){let r=e.cmds,i={styles:[],bootScript:""};e._webCtx=i,e._state=e._state||{},e._stateRefs=e._stateRefs||new Set;let m=r.text;r.text=([t])=>{if(!t)return"";let o=e._state,s=e._runtime===!0,n=t.replace(/\x01/g,"");return n=n.replace(/\$([a-zA-Z_][a-zA-Z0-9_-]*)/g,(a,l)=>l in o?(e._stateRefs.add(l),s?String(o[l]):`<span data-bind="${l}">${o[l]}</span>`):a),n=n.replace(/\x02/g,"$"),n};let f=r.set;r.set=([t,o],s)=>t in e._state?(e._state[t]=o??"",e._stateRefs.add(t),null):f([t,o],s),r.elem=([t,o],s)=>{if(!t)return"";let n=typeof o=="string"?o:"",a=e._elemAttrs,l=e._elemEvents;e._elemAttrs={},e._elemEvents={};let d;try{let p=y(n);d=_(p,s,e).join("")}catch{d=n}let c={...e._elemAttrs},$={...e._elemEvents};e._elemAttrs=a,e._elemEvents=l;let b="";for(let[p,g]of Object.entries(c))b+=g?` ${p}="${g}"`:` ${p}`;for(let[p,g]of Object.entries($))b+=` on${p}='${g}'`;return new Set(["br","hr","img","input","meta","link","area","base","col","embed","source","track","wbr"]).has(t)?`<${t}${b}>`:`<${t}${b}>${d}</${t}>`},r.a=([t,o],s)=>{let n=typeof o=="string"?o:"",a=e._elemAttrs,l=e._elemEvents;e._elemAttrs={href:t??"#"},e._elemEvents={};let d;try{d=_(y(n),s,e).join("")}catch{d=n}let c={...e._elemAttrs},$={...e._elemEvents};e._elemAttrs=a,e._elemEvents=l;let b="";for(let[u,p]of Object.entries(c))b+=p?` ${u}="${p}"`:` ${u}`;for(let[u,p]of Object.entries($))b+=` on${u}='${p}'`;return`<a${b}>${d}</a>`},r.attr=([t,o])=>e._elemAttrs?(e._elemAttrs[t]=o??"",null):` ${t}="${o??""}"`,r.on=([t,o])=>{let n=y(typeof o=="string"?o:""),a=J(n,e,n);return e._elemEvents?(e._elemEvents[t]=a,null):` on${t}='${a}'`},r.state=([t,o])=>(t&&!e._runtime&&(e._state[t]=o??""),null),r.style=([t])=>(t&&i.styles.push(L(t,e)),null)}function E(e){let r=e._webCtx||{styles:[],bootScript:""},i=e._state||{},m=e._stateRefs||new Set,f=r.styles.join(`
`),t="";if(m.size>0){let o={};for(let n of Object.keys(i))o[n]=i[n];let s=(e._source||"").replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/\n/g,"\\n");t=`
var __s=${JSON.stringify(o)};
var __src='${s}';
var __ast=khem.parse(__src);
function __set(k,v){__s[k]=String(v);
var _env=khem.createEnvironment(true);
_env._state=__s;_env._runtime=true;
var _scope=khem.createScope();_scope.vars=__s;
khem.loadWebLib(_env);
document.getElementById('app').innerHTML=khem.evaluate(__ast,_scope,_env).join('');}
`}return`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ${f}
  </style>
</head>
<body>
  <div id="app">${e._output||""}</div>
  <script src="khem-runtime.js"><\/script>
  ${t?`<script>${t}<\/script>`:""}
</body>
</html>`}function k(e=!1){let r={cmds:{},vars:{}};return j(r),e&&A(r),r}function Y(e,r=k()){return _(y(e),{vars:r.vars,parent:null},r).join("")}function G(e,r){let i=k(!0);r&&(i._baseDir=r),i._source=e;let m=N();if(m){let t={vars:i.vars,parent:null};_(y(m),t,i)}let f={vars:i.vars,parent:null};return i._output=_(y(e),f,i).join(""),E(i)}function V(e){let r=k(!0),i=N();if(i){let m={vars:r.vars,parent:null};_(y(i),m,r)}return e.replace(/<script\s+type="text\/khem"[^>]*>([\s\S]*?)<\/script>/gi,(m,f)=>{try{let t={vars:r.vars,parent:null};return _(y(f.trim()),t,r).join("")}catch(t){return console.error("Khem script error:",t),`<!-- Error: ${t.message} -->`}})}var v=null;function N(){return v||(v=R,v)}var R=`proc div {body} { elem "div" "$body" }
proc span {body} { elem "span" "$body" }
proc p {body} { elem "p" "$body" }
proc h1 {body} { elem "h1" "$body" }
proc h2 {body} { elem "h2" "$body" }
proc h3 {body} { elem "h3" "$body" }
proc h4 {body} { elem "h4" "$body" }
proc h5 {body} { elem "h5" "$body" }
proc h6 {body} { elem "h6" "$body" }
proc ul {body} { elem "ul" "$body" }
proc ol {body} { elem "ol" "$body" }
proc li {body} { elem "li" "$body" }
proc table {body} { elem "table" "$body" }
proc tr {body} { elem "tr" "$body" }
proc td {body} { elem "td" "$body" }
proc th {body} { elem "th" "$body" }
proc section {body} { elem "section" "$body" }
proc main {body} { elem "main" "$body" }
proc header {body} { elem "header" "$body" }
proc footer {body} { elem "footer" "$body" }
proc nav {body} { elem "nav" "$body" }
proc article {body} { elem "article" "$body" }
proc form {body} { elem "form" "$body" }
proc pre {body} { elem "pre" "$body" }
proc code {body} { elem "code" "$body" }
proc blockquote {body} { elem "blockquote" "$body" }
proc strong {body} { elem "strong" "$body" }
proc em {body} { elem "em" "$body" }
proc button {body} { elem "button" "$body" }
proc br {} { elem "br" "" }
proc hr {} { elem "hr" "" }
proc img {src; alt ""} { elem "img" ""; attr "src" "$src"; attr "alt" "$alt" }
proc input {body} { elem "input" "$body" }
proc class {name} { attr "class" "$name" }
proc id {name} { attr "id" "$name" }
proc data {key; val} { attr "data-$key" "$val" }
proc href {url} { attr "href" "$url" }
proc src {url} { attr "src" "$url" }
proc type {val} { attr "type" "$val" }
proc value {val} { attr "value" "$val" }
proc placeholder {val} { attr "placeholder" "$val" }
proc on_click {body} { on "click" "$body" }
proc on_input {body} { on "input" "$body" }
proc on_change {body} { on "change" "$body" }
proc on_submit {body} { on "submit" "$body" }
proc on_keydown {body} { on "keydown" "$body" }`;export{k as createEnvironment,w as createScope,_ as evaluate,y as parse,V as processScriptTags,C as render,G as renderForWeb,Y as run,x as sub};

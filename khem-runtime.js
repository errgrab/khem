var khem=(()=>{var J=Object.create;var k=Object.defineProperty;var L=Object.getOwnPropertyDescriptor;var B=Object.getOwnPropertyNames;var R=Object.getPrototypeOf,D=Object.prototype.hasOwnProperty;var E=(e=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(e,{get:(r,c)=>(typeof require<"u"?require:r)[c]}):e)(function(e){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+e+'" is not supported')});var q=(e,r)=>{for(var c in r)k(e,c,{get:r[c],enumerable:!0})},O=(e,r,c,b)=>{if(r&&typeof r=="object"||typeof r=="function")for(let f of B(r))!D.call(e,f)&&f!==c&&k(e,f,{get:()=>r[f],enumerable:!(b=L(r,f))||b.enumerable});return e};var C=(e,r,c)=>(c=e!=null?J(R(e)):{},O(r||!e||!e.__esModule?k(c,"default",{value:e,enumerable:!0}):c,e)),z=e=>O(k({},"__esModule",{value:!0}),e);var F={};q(F,{createEnvironment:()=>Z,createScope:()=>w,evaluate:()=>$,generateHTML:()=>N,loadStdLib:()=>j,loadWebLib:()=>A,lookup:()=>v,parse:()=>h,sub:()=>x});function h(e){let r=[],c=0,b=e.length,f=()=>e[c],t=()=>e[c++],o=u=>u===" "||u==="	"||u==="\r",n=u=>u===";"||u===`
`,s=()=>c>=b,a=()=>{for(;!s()&&o(f());)t()},l=()=>{t();let u=1,p=c;for(;!s();){let g=t();if(g==="{")u++;else if(g==="}"&&--u===0)break}return e.slice(p,c-1).trim()},d=()=>{t();let u=1,p=c;for(;!s();){let g=t();if(g==="[")u++;else if(g==="]"&&--u===0)break}return h(e.slice(p,c-1).trim())},i=()=>{t();let u="",p=!1;for(;!s()&&!(!p&&f()==='"');){let g=t();if(g==="\\"&&!p){p=!0;continue}if(p){if(p=!1,g==="n"){u+=`
`;continue}if(g==="t"){u+="	";continue}if(g==="$"){u+="";continue}}u+=g}return s()||t(),u},_=()=>{let u="";for(;!s();){let p=f();if(o(p)||n(p)||p==="#"||p==="["||p==="]"||p==="{"||p==="}"||p==='"')break;u+=t()}return u},m=()=>{let u=[];for(;!s()&&(a(),!s());){let p=f();if(n(p)||p==="#")break;p==="{"?u.push(l()):p==="["?u.push(d()):p==='"'?u.push(i()):u.push(_())}return u};for(;!s()&&(a(),!s());){let u=f();if(n(u)){t();continue}if(u==="#"){for(;!s()&&f()!==`
`;)t();continue}let p=m();p.length>0&&r.push(p)}return r}var w=(e=null)=>({vars:{},parent:e}),v=(e,r)=>{let c=e;for(;c;){if(r in c.vars)return String(c.vars[r]);c=c.parent}return null};function x(e,r){return typeof e!="string"?e:e.replace(/\$([a-zA-Z_][a-zA-Z0-9_-]*)/g,(c,b)=>v(r,b)??c).replace(/\x01/g,"$")}function $(e,r,c){let b=[],f=c.sub??x;for(let t of e){if(!Array.isArray(t)||t.length===0)continue;let o=typeof t[0]=="string"?t[0]:null;if(!o)continue;let n=c.cmds[o];if(!n){console.error(`Unknown command: ${o}`);continue}let a=t.slice(1).map(d=>Array.isArray(d)?$(d,r,c).join(""):f(d,r)),l=n(a,r);if(l?.__khemReturn)return[l.value??""];l!=null&&b.push(String(l))}return b}var S=e=>e&&e!=="0"&&e!=="false",y=e=>Number(e)||0;function j(e){let r=e.cmds;r.text=t=>t[0]??"",r.set=(t,o)=>(o.vars[t[0]]=t[1]??"",null),r.puts=t=>(console.log(t.join(" ")),null),r.if=(t,o)=>{let[n,s,a,l]=t;return S(n)?$(h(s),o,e):a==="else"&&l?$(h(l),o,e):null},r.for=(t,o)=>{let[n,s,a,l]=t,d=[],i=h(l),_=o.vars[n];for(let m=y(s);m<=y(a);m++)o.vars[n]=String(m),d.push(...$(i,o,e));return _!==void 0?o.vars[n]=_:delete o.vars[n],d},r.foreach=(t,o)=>{let[n,s,a]=t,l=String(s).split(/\s+/).filter(Boolean),d=h(a),i=[],_=o.vars[n];for(let m of l)o.vars[n]=m,i.push(...$(d,o,e));return _!==void 0?o.vars[n]=_:delete o.vars[n],i},r.proc=t=>{let[o,n,s]=t,a=h(s),l=h(n).map(d=>typeof d=="string"?{name:d,default:null}:{name:d[0],default:d[1]??null});return r[o]=(d,i)=>{let _=w(i),m=0;for(let p of l){let g=m<d.length?d[m++]:p.default??"";_.vars[p.name]=g}let u=$(a,_,e);return u.length>0&&u[0]?.__khemReturn?[u[0].value??""]:u},null},r.return=t=>({__khemReturn:!0,value:t[0]??""}),r.list=t=>t.join(" "),r.llength=t=>t[0].split(/\s+/).filter(Boolean).length,r.lindex=t=>t[0].split(/\s+/).filter(Boolean)[y(t[1])]??"",r.lappend=(t,o)=>(o.vars[t[0]]=(o.vars[t[0]]||"")+" "+t.slice(1).join(" "),null),r.concat=t=>t.join(" "),r.join=t=>t.length===2&&t[0].includes(" ")?t[0].split(/\s+/).join(t[1]||" "):t.join(""),r.expr=(t,o)=>{let n=t.join(" ");n=n.replace(/==/g,"===").replace(/!=/g,"!==");try{return String(new Function("return "+n)())}catch{return"0"}},r.incr=(t,o)=>(o.vars[t[0]]=String(y(o.vars[t[0]]||0)+y(t[1]||1)),o.vars[t[0]]),r.abs=t=>String(Math.abs(y(t[0]))),r.round=t=>String(Math.round(y(t[0]))),r.floor=t=>String(Math.floor(y(t[0]))),r.ceil=t=>String(Math.ceil(y(t[0]))),r.sqrt=t=>String(Math.sqrt(y(t[0]))),r.max=t=>String(Math.max(...t.map(y))),r.min=t=>String(Math.min(...t.map(y))),r.string=t=>{let[o,n,...s]=t;switch(o){case"length":return String(n.length);case"index":return n[y(s[0])]||"";case"range":return n.slice(y(s[0]),s[1]?y(s[1])+1:void 0);case"trim":return n.trim();case"toupper":return n.toUpperCase();case"tolower":return n.toLowerCase();case"match":return new RegExp(s[0].replace(/\*/g,".*").replace(/\?/g,".")).test(n)?"1":"0";default:return""}},r.eq=t=>t[0]===t[1]?"1":"0",r.neq=t=>t[0]!==t[1]?"1":"0",r.gt=t=>y(t[0])>y(t[1])?"1":"0",r.lt=t=>y(t[0])<y(t[1])?"1":"0",r.gte=t=>y(t[0])>=y(t[1])?"1":"0",r.lte=t=>y(t[0])<=y(t[1])?"1":"0",r.not=t=>S(t[0])?"0":"1",r.and=t=>S(t[0])&&S(t[1])?"1":"0",r.or=t=>S(t[0])||S(t[1])?"1":"0",r.replace=t=>t[0].replaceAll(t[1],t[2]),r.trim=t=>t[0].trim(),r.upper=t=>t[0].toUpperCase(),r.lower=t=>t[0].toLowerCase(),r.slice=t=>t[0].slice(y(t[1]),t[2]?y(t[2]):void 0),r.contains=t=>t[0].includes(t[1])?"1":"0",r["starts-with"]=t=>t[0].startsWith(t[1])?"1":"0",r["ends-with"]=t=>t[0].endsWith(t[1])?"1":"0",r.today=()=>new Date().toISOString().slice(0,10),r.clock=t=>t[0]==="seconds"?String(Math.floor(Date.now()/1e3)):new Date().toLocaleString(),r.match=(t,o)=>{let n=t[0],s=[];if(t.length===2&&typeof t[1]=="string"){let l=t[1],d=[],i=0;for(;i<l.length;){for(;i<l.length&&/\s/.test(l[i]);)i++;if(i>=l.length)break;let _="";if(l[i]==='"'){for(i++;i<l.length&&l[i]!=='"';)_+=l[i],i++;i<l.length&&i++}else for(;i<l.length&&!/[\s{}]/.test(l[i]);)_+=l[i],i++;for(;i<l.length&&/\s/.test(l[i]);)i++;if(l[i]==="{"){i++;let m=1,u="";for(;i<l.length&&m>0&&(l[i]==="{"&&m++,!(l[i]==="}"&&(m--,m===0)));)u+=l[i],i++;i<l.length&&i++,d.push([_.trim(),u.trim()])}}s=d}else for(let l=1;l<t.length;l++)Array.isArray(t[l])&&t[l].length>=2&&s.push(t[l]);let a=null;for(let[l,d]of s){let i=h(d);if(l==="default"){a=i;continue}if(l===n)return $(i,o,e)}return a?$(a,o,e):null},r.try=(t,o)=>{try{return $(h(t[0]),o,e)}catch(n){let s=o.vars.error;if(t[1]==="catch"&&t[2])return o.vars.error=n.message,$(h(t[2]),o,e);throw s!==void 0?o.vars.error=s:delete o.vars.error,n}},r.throw=t=>{throw new Error(t[0])},r.dict=t=>{let[o,...n]=t;switch(o){case"create":{let s=[];for(let a=0;a<n.length;a+=2)s.push(n[a],n[a+1]||"");return s.join(" ")}case"get":{let s=n[0].split(/\s+/);for(let a=0;a<s.length;a+=2)if(s[a]===n[1])return s[a+1];return""}case"set":{let s=n[0]?n[0].split(/\s+/):[],a=n[1],l=n[2],d=!1;for(let i=0;i<s.length;i+=2)if(s[i]===a){s[i+1]=l,d=!0;break}return d||s.push(a,l),s.join(" ")}default:return""}};let c=null,b=null,f=()=>typeof process<"u"&&process.versions?.node!=null;f()&&Promise.all([import("node:fs").catch(()=>null),import("node:path").catch(()=>null)]).then(([t,o])=>{t&&(c=t.default??t),o&&(b=o.default??o)}),r.include=([t],o)=>{if(!t)return;if(!f()){console.warn(`include "${t}" skipped \u2014 browser`);return}if(!c||!b){console.error(`include "${t}" skipped \u2014 no fs`);return}let n=e._baseDir??process.cwd(),s=b.resolve(n,t);if(e._includes||(e._includes=new Set),e._includes.has(s))return;e._includes.add(s);let a=e._baseDir;try{e._baseDir=b.dirname(s);let l=c.readFileSync(s,"utf8");$(h(l),o,e)}catch(l){console.error(`include error: ${l.message}`)}finally{e._baseDir=a}}}function M(e,r){let c=f=>Array.isArray(f)?$(f,{vars:r.vars,parent:null},r).join(""):String(f),b=(f,t="")=>h(f).map(o=>{let n=o[o.length-1];return typeof n=="string"&&/[;\n]/.test(n)?`${t}${o.slice(0,-1).map(c).join(" ")} { 
${b(n,t+"  ")}${t}}`:`${t}${c(o[0])}: ${o.slice(1).map(c).join(" ")};`}).join(`
`)+`
`;return b(e)}function T(e,r,c){let b=[];for(let f=0;f<e.length;f++){let t=e[f];if(!Array.isArray(t)||t.length===0)continue;let o=t[0],n=t.slice(1);if(o==="set"){let s=typeof n[0]=="string"?n[0]:"",l=(c&&c[f]?c[f]:t).slice(1);if(n[1]==="expr"&&typeof n[2]=="string"){let i=(typeof l[2]=="string"?l[2]:n[2]).replace(/\$([a-zA-Z_][a-zA-Z0-9_-]*)/g,(_,m)=>`Number(__s[${JSON.stringify(m)}])`);b.push(`__set(${JSON.stringify(s)}, (function(){try{return String(eval(${JSON.stringify(i)}))}catch{return "0"}})())`)}else{let d=n[1],i=typeof d=="string"?JSON.stringify(d):'""';b.push(`__set(${JSON.stringify(s)}, ${i})`)}}else{let s=n.map(a=>typeof a=="string"?JSON.stringify(a):'""');b.push(`__cmd(${JSON.stringify(o)}, ${s.join(", ")})`)}}return b.join("; ")}function A(e){let r=e.cmds,c={styles:[],bootScript:""};e._webCtx=c,e._state=e._state||{},e._stateRefs=e._stateRefs||new Set;let b=r.text;r.text=([t])=>{if(!t)return"";let o=e._state,n=t.replace(/\x01/g,"");return n=n.replace(/\$([a-zA-Z_][a-zA-Z0-9_-]*)/g,(s,a)=>a in o?(e._stateRefs.add(a),`<span data-bind="${a}">${o[a]}</span>`):s),n=n.replace(/\x02/g,"$"),n};let f=r.set;r.set=([t,o],n)=>t in e._state?(e._state[t]=o??"",e._stateRefs.add(t),null):f([t,o],n),r.elem=([t,o],n)=>{if(!t)return"";let s=typeof o=="string"?o:"",a=e._elemAttrs,l=e._elemEvents;e._elemAttrs={},e._elemEvents={};let d;try{let p=h(s);d=$(p,n,e).join("")}catch{d=s}let i={...e._elemAttrs},_={...e._elemEvents};e._elemAttrs=a,e._elemEvents=l;let m="";for(let[p,g]of Object.entries(i))m+=g?` ${p}="${g}"`:` ${p}`;for(let[p,g]of Object.entries(_))m+=` on${p}='${g}'`;return new Set(["br","hr","img","input","meta","link","area","base","col","embed","source","track","wbr"]).has(t)?`<${t}${m}>`:`<${t}${m}>${d}</${t}>`},r.a=([t,o],n)=>{let s=typeof o=="string"?o:"",a=e._elemAttrs,l=e._elemEvents;e._elemAttrs={href:t??"#"},e._elemEvents={};let d;try{d=$(h(s),n,e).join("")}catch{d=s}let i={...e._elemAttrs},_={...e._elemEvents};e._elemAttrs=a,e._elemEvents=l;let m="";for(let[u,p]of Object.entries(i))m+=p?` ${u}="${p}"`:` ${u}`;for(let[u,p]of Object.entries(_))m+=` on${u}='${p}'`;return`<a${m}>${d}</a>`},r.attr=([t,o])=>e._elemAttrs?(e._elemAttrs[t]=o??"",null):` ${t}="${o??""}"`,r.on=([t,o])=>{let s=h(typeof o=="string"?o:""),a=T(s,e,s);return e._elemEvents?(e._elemEvents[t]=a,null):` on${t}='${a}'`},r.state=([t,o])=>(t&&!e._runtime&&(e._state[t]=o??""),null),r.style=([t])=>(t&&c.styles.push(M(t,e)),null)}function N(e){let r=e._webCtx||{styles:[],bootScript:""},c=e._state||{},b=e._stateRefs||new Set,f=r.styles.join(`
`),t="";if(b.size>0){let o={};for(let s of Object.keys(c))o[s]=c[s];let n=(e._source||"").replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/\n/g,"\\n");t=`
var __s=${JSON.stringify(o)};
var __src='${n}';
var __ast=khem.parse(__src);
function __set(k,v){__s[k]=String(v);
var els=document.querySelectorAll('[data-bind="'+k+'"]');
if(els.length){els.forEach(function(e){e.textContent=__s[k];});}
else{var _env=khem.createEnvironment(true);
_env._state=__s;_env._runtime=true;
var _scope=khem.createScope();_scope.vars=__s;
document.getElementById('app').innerHTML=khem.evaluate(__ast,_scope,_env).join('');}}
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
</html>`}var W=`proc div {body} { elem "div" "$body" }
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
proc on_keydown {body} { on "keydown" "$body" }`;function Z(e=!1){let r={cmds:{},vars:{}};if(j(r),e){A(r);let c=w();$(h(W),c,r)}return r}return z(F);})();

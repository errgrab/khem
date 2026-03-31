function h(e){let r=[],c=0,f=e.length,m=()=>e[c],t=()=>e[c++],o=a=>a===" "||a==="	"||a==="\r",n=a=>a===";"||a===`
`,s=()=>c>=f,p=()=>{for(;!s()&&o(m());)t()},l=()=>{t();let a=1,u=c;for(;!s();){let S=t();if(S==="{")a++;else if(S==="}"&&--a===0)break}return e.slice(u,c-1).trim()},d=()=>{t();let a=1,u=c;for(;!s();){let S=t();if(S==="[")a++;else if(S==="]"&&--a===0)break}return h(e.slice(u,c-1).trim())},i=()=>{t();let a="",u=!1;for(;!s()&&!(!u&&m()==='"');){let S=t();if(S==="\\"&&!u){u=!0;continue}if(u){if(u=!1,S==="n"){a+=`
`;continue}if(S==="t"){a+="	";continue}}a+=S}return s()||t(),a},_=()=>{let a="";for(;!s();){let u=m();if(o(u)||n(u)||u==="#"||u==="["||u==="]"||u==="{"||u==="}"||u==='"')break;a+=t()}return a},y=()=>{let a=[];for(;!s()&&(p(),!s());){let u=m();if(n(u)||u==="#")break;u==="{"?a.push(l()):u==="["?a.push(d()):u==='"'?a.push(i()):a.push(_())}return a};for(;!s()&&(p(),!s());){let a=m();if(n(a)){t();continue}if(a==="#"){for(;!s()&&m()!==`
`;)t();continue}let u=y();u.length>0&&r.push(u)}return r}var w=(e=null)=>({vars:{},parent:e}),O=(e,r)=>{let c=e;for(;c;){if(r in c.vars)return String(c.vars[r]);c=c.parent}return null};function j(e,r){return typeof e!="string"?e:e.replace(/\$([a-zA-Z_][a-zA-Z0-9_-]*)/g,(c,f)=>O(r,f)??c)}function $(e,r,c){let f=[],m=c.sub??j;for(let t of e){if(!Array.isArray(t)||t.length===0)continue;let o=typeof t[0]=="string"?t[0]:null;if(!o)continue;let n=c.cmds[o];if(!n){console.error(`Unknown command: ${o}`);continue}let p=t.slice(1).map(d=>Array.isArray(d)?$(d,r,c).join(""):m(d,r)),l=n(p,r);if(l?.__khemReturn)return[l.value??""];l!=null&&f.push(String(l))}return f}function C(e,r){return $(e,w(),r).join("")}var g=e=>e&&e!=="0"&&e!=="false",b=e=>Number(e)||0;function x(e){let r=e.cmds;r.text=t=>t[0]??"",r.set=(t,o)=>(o.vars[t[0]]=t[1]??"",null),r.puts=t=>(console.log(t.join(" ")),null),r.if=(t,o)=>{let[n,s,p,l]=t;return g(n)?$(h(s),o,e):p==="else"&&l?$(h(l),o,e):null},r.for=(t,o)=>{let[n,s,p,l]=t,d=[],i=h(l),_=o.vars[n];for(let y=b(s);y<=b(p);y++)o.vars[n]=String(y),d.push(...$(i,o,e));return _!==void 0?o.vars[n]=_:delete o.vars[n],d},r.foreach=(t,o)=>{let[n,s,p]=t,l=String(s).split(/\s+/).filter(Boolean),d=h(p),i=[],_=o.vars[n];for(let y of l)o.vars[n]=y,i.push(...$(d,o,e));return _!==void 0?o.vars[n]=_:delete o.vars[n],i},r.proc=t=>{let[o,n,s]=t,p=h(s),l=h(n).map(d=>typeof d=="string"?{name:d,default:null}:{name:d[0],default:d[1]??null});return r[o]=(d,i)=>{let _=w(i),y=0;for(let u of l){let S=y<d.length?d[y++]:u.default??"";_.vars[u.name]=S}let a=$(p,_,e);return a.length>0&&a[0]?.__khemReturn?[a[0].value??""]:a},null},r.return=t=>({__khemReturn:!0,value:t[0]??""}),r.list=t=>t.join(" "),r.llength=t=>t[0].split(/\s+/).filter(Boolean).length,r.lindex=t=>t[0].split(/\s+/).filter(Boolean)[b(t[1])]??"",r.lappend=(t,o)=>(o.vars[t[0]]=(o.vars[t[0]]||"")+" "+t.slice(1).join(" "),null),r.concat=t=>t.join(" "),r.join=t=>t.length===2&&t[0].includes(" ")?t[0].split(/\s+/).join(t[1]||" "):t.join(""),r.expr=(t,o)=>{let n=t.join(" ");n=n.replace(/==/g,"===").replace(/!=/g,"!==");try{return String(new Function("return "+n)())}catch{return"0"}},r.incr=(t,o)=>(o.vars[t[0]]=String(b(o.vars[t[0]]||0)+b(t[1]||1)),o.vars[t[0]]),r.abs=t=>String(Math.abs(b(t[0]))),r.round=t=>String(Math.round(b(t[0]))),r.floor=t=>String(Math.floor(b(t[0]))),r.ceil=t=>String(Math.ceil(b(t[0]))),r.sqrt=t=>String(Math.sqrt(b(t[0]))),r.max=t=>String(Math.max(...t.map(b))),r.min=t=>String(Math.min(...t.map(b))),r.string=t=>{let[o,n,...s]=t;switch(o){case"length":return String(n.length);case"index":return n[b(s[0])]||"";case"range":return n.slice(b(s[0]),s[1]?b(s[1])+1:void 0);case"trim":return n.trim();case"toupper":return n.toUpperCase();case"tolower":return n.toLowerCase();case"match":return new RegExp(s[0].replace(/\*/g,".*").replace(/\?/g,".")).test(n)?"1":"0";default:return""}},r.eq=t=>t[0]===t[1]?"1":"0",r.neq=t=>t[0]!==t[1]?"1":"0",r.gt=t=>b(t[0])>b(t[1])?"1":"0",r.lt=t=>b(t[0])<b(t[1])?"1":"0",r.gte=t=>b(t[0])>=b(t[1])?"1":"0",r.lte=t=>b(t[0])<=b(t[1])?"1":"0",r.not=t=>g(t[0])?"0":"1",r.and=t=>g(t[0])&&g(t[1])?"1":"0",r.or=t=>g(t[0])||g(t[1])?"1":"0",r.replace=t=>t[0].replaceAll(t[1],t[2]),r.trim=t=>t[0].trim(),r.upper=t=>t[0].toUpperCase(),r.lower=t=>t[0].toLowerCase(),r.slice=t=>t[0].slice(b(t[1]),t[2]?b(t[2]):void 0),r.contains=t=>t[0].includes(t[1])?"1":"0",r["starts-with"]=t=>t[0].startsWith(t[1])?"1":"0",r["ends-with"]=t=>t[0].endsWith(t[1])?"1":"0",r.today=()=>new Date().toISOString().slice(0,10),r.clock=t=>t[0]==="seconds"?String(Math.floor(Date.now()/1e3)):new Date().toLocaleString(),r.match=(t,o)=>{let n=t[0],s=[];if(t.length===2&&typeof t[1]=="string"){let l=t[1],d=[],i=0;for(;i<l.length;){for(;i<l.length&&/\s/.test(l[i]);)i++;if(i>=l.length)break;let _="";if(l[i]==='"'){for(i++;i<l.length&&l[i]!=='"';)_+=l[i],i++;i<l.length&&i++}else for(;i<l.length&&!/[\s{}]/.test(l[i]);)_+=l[i],i++;for(;i<l.length&&/\s/.test(l[i]);)i++;if(l[i]==="{"){i++;let y=1,a="";for(;i<l.length&&y>0&&(l[i]==="{"&&y++,!(l[i]==="}"&&(y--,y===0)));)a+=l[i],i++;i<l.length&&i++,d.push([_.trim(),a.trim()])}}s=d}else for(let l=1;l<t.length;l++)Array.isArray(t[l])&&t[l].length>=2&&s.push(t[l]);let p=null;for(let[l,d]of s){let i=h(d);if(l==="default"){p=i;continue}if(l===n)return $(i,o,e)}return p?$(p,o,e):null},r.try=(t,o)=>{try{return $(h(t[0]),o,e)}catch(n){let s=o.vars.error;if(t[1]==="catch"&&t[2])return o.vars.error=n.message,$(h(t[2]),o,e);throw s!==void 0?o.vars.error=s:delete o.vars.error,n}},r.throw=t=>{throw new Error(t[0])},r.dict=t=>{let[o,...n]=t;switch(o){case"create":{let s=[];for(let p=0;p<n.length;p+=2)s.push(n[p],n[p+1]||"");return s.join(" ")}case"get":{let s=n[0].split(/\s+/);for(let p=0;p<s.length;p+=2)if(s[p]===n[1])return s[p+1];return""}case"set":{let s=n[0]?n[0].split(/\s+/):[],p=n[1],l=n[2],d=!1;for(let i=0;i<s.length;i+=2)if(s[i]===p){s[i+1]=l,d=!0;break}return d||s.push(p,l),s.join(" ")}default:return""}};let c=null,f=null,m=()=>typeof process<"u"&&process.versions?.node!=null;m()&&Promise.all([import("node:fs").catch(()=>null),import("node:path").catch(()=>null)]).then(([t,o])=>{t&&(c=t.default??t),o&&(f=o.default??o)}),r.include=([t],o)=>{if(!t)return;if(!m()){console.warn(`include "${t}" skipped \u2014 browser`);return}if(!c||!f){console.error(`include "${t}" skipped \u2014 no fs`);return}let n=e._baseDir??process.cwd(),s=f.resolve(n,t);if(e._includes||(e._includes=new Set),e._includes.has(s))return;e._includes.add(s);let p=e._baseDir;try{e._baseDir=f.dirname(s);let l=c.readFileSync(s,"utf8");$(h(l),o,e)}catch(l){console.error(`include error: ${l.message}`)}finally{e._baseDir=p}}}function J(e,r){let c=m=>Array.isArray(m)?$(m,{vars:r.vars,parent:null},r).join(""):String(m),f=(m,t="")=>h(m).map(o=>{let n=o[o.length-1];return typeof n=="string"&&/[;\n]/.test(n)?`${t}${o.slice(0,-1).map(c).join(" ")} { 
${f(n,t+"  ")}${t}}`:`${t}${c(o[0])}: ${o.slice(1).map(c).join(" ")};`}).join(`
`)+`
`;return f(e)}function L(e,r){let c=[];for(let f of e){if(!Array.isArray(f)||f.length===0)continue;let m=f[0],t=f.slice(1);if(m==="set"){let o=typeof t[0]=="string"?t[0]:"";if(t[1]==="expr"&&typeof t[2]=="string"){let n=t[2].replace(/\$([a-zA-Z_][a-zA-Z0-9_-]*)/g,(s,p)=>`__s[${JSON.stringify(p)}]`);c.push(`__set(${JSON.stringify(o)}, (function(){try{return String(eval(${JSON.stringify(n)}))}catch{return "0"}})())`)}else{let n=t[1],s=typeof n=="string"?JSON.stringify(n):'""';c.push(`__set(${JSON.stringify(o)}, ${s})`)}}else{let o=t.map(n=>typeof n=="string"?JSON.stringify(n):'""');c.push(`__cmd(${JSON.stringify(m)}, ${o.join(", ")})`)}}return c.join("; ")}function A(e){let r=e.cmds,c={styles:[],bootScript:""};e._webCtx=c,e._state=e._state||{},e._stateRefs=e._stateRefs||new Set;let f=r.text;r.text=([t])=>{if(!t)return"";let o=e._state;return t.replace(/\$([a-zA-Z_][a-zA-Z0-9_-]*)/g,(n,s)=>s in o?(e._stateRefs.add(s),`<span data-bind="${s}">${o[s]}</span>`):n)};let m=r.set;r.set=([t,o],n)=>t in e._state?(e._state[t]=o??"",e._stateRefs.add(t),null):m([t,o],n),r.elem=([t,o],n)=>{if(!t)return"";let s=typeof o=="string"?o:"",p=e._elemAttrs,l=e._elemEvents;e._elemAttrs={},e._elemEvents={};let d;try{let u=h(s);d=$(u,n,e).join("")}catch{d=s}let i={...e._elemAttrs},_={...e._elemEvents};e._elemAttrs=p,e._elemEvents=l;let y="";for(let[u,S]of Object.entries(i))y+=S?` ${u}="${S}"`:` ${u}`;for(let[u,S]of Object.entries(_))y+=` on${u}='${S}'`;return new Set(["br","hr","img","input","meta","link","area","base","col","embed","source","track","wbr"]).has(t)?`<${t}${y}>`:`<${t}${y}>${d}</${t}>`},r.a=([t,o],n)=>{let s=typeof o=="string"?o:"",p=e._elemAttrs,l=e._elemEvents;e._elemAttrs={href:t??"#"},e._elemEvents={};let d;try{d=$(h(s),n,e).join("")}catch{d=s}let i={...e._elemAttrs},_={...e._elemEvents};e._elemAttrs=p,e._elemEvents=l;let y="";for(let[a,u]of Object.entries(i))y+=u?` ${a}="${u}"`:` ${a}`;for(let[a,u]of Object.entries(_))y+=` on${a}='${u}'`;return`<a${y}>${d}</a>`},r.attr=([t,o])=>e._elemAttrs?(e._elemAttrs[t]=o??"",null):` ${t}="${o??""}"`,r.on=([t,o])=>{let s=L(h(typeof o=="string"?o:""),e);return e._elemEvents?(e._elemEvents[t]=s,null):` on${t}='${s}'`},r.state=([t,o])=>(t&&(e._state[t]=o??""),null),r.style=([t])=>(t&&c.styles.push(J(t,e)),null)}function E(e){let r=e._webCtx||{styles:[],bootScript:""},c=e._state||{},f=e._stateRefs||new Set,m=r.styles.join(`
`),t="";if(f.size>0){let o={};for(let n of f)n in c&&(o[n]=c[n]);t=`
var __s=${JSON.stringify(o)};
function __set(k,v){__s[k]=v;
document.querySelectorAll('[data-bind="'+k+'"]').forEach(function(e){e.textContent=v;});
}`}return`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ${m}
  </style>
</head>
<body>
  <div id="app">${e._output||""}</div>
  ${t?`<script>${t}<\/script>`:""}
</body>
</html>`}function v(e=!1){let r={cmds:{},vars:{}};return x(r),e&&A(r),r}function Y(e,r=v()){return $(h(e),{vars:r.vars,parent:null},r).join("")}function G(e,r){let c=v(!0);r&&(c._baseDir=r);let f=N();if(f){let t={vars:c.vars,parent:null};$(h(f),t,c)}let m={vars:c.vars,parent:null};return c._output=$(h(e),m,c).join(""),E(c)}function V(e){let r=v(!0),c=N();if(c){let f={vars:r.vars,parent:null};$(h(c),f,r)}return e.replace(/<script\s+type="text\/khem"[^>]*>([\s\S]*?)<\/script>/gi,(f,m)=>{try{let t={vars:r.vars,parent:null};return $(h(m.trim()),t,r).join("")}catch(t){return console.error("Khem script error:",t),`<!-- Error: ${t.message} -->`}})}var k=null;function N(){return k||(k=R,k)}var R=`proc div {body} { elem "div" "$body" }
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
proc on_keydown {body} { on "keydown" "$body" }`;export{v as createEnvironment,w as createScope,$ as evaluate,h as parse,V as processScriptTags,C as render,G as renderForWeb,Y as run,j as sub};

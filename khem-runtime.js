var khem=(()=>{var L=Object.create;var k=Object.defineProperty;var B=Object.getOwnPropertyDescriptor;var J=Object.getOwnPropertyNames;var D=Object.getPrototypeOf,M=Object.prototype.hasOwnProperty;var E=(e=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(e,{get:(r,i)=>(typeof require<"u"?require:r)[i]}):e)(function(e){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+e+'" is not supported')});var W=(e,r)=>{for(var i in r)k(e,i,{get:r[i],enumerable:!0})},C=(e,r,i,u)=>{if(r&&typeof r=="object"||typeof r=="function")for(let a of J(r))!M.call(e,a)&&a!==i&&k(e,a,{get:()=>r[a],enumerable:!(u=B(r,a))||u.enumerable});return e};var O=(e,r,i)=>(i=e!=null?L(D(e)):{},C(r||!e||!e.__esModule?k(i,"default",{value:e,enumerable:!0}):i,e)),q=e=>C(k({},"__esModule",{value:!0}),e);var H={};W(H,{createEnvironment:()=>F,createScope:()=>S,evaluate:()=>_,generateHTML:()=>N,loadStdLib:()=>x,loadWebLib:()=>A,lookup:()=>v,parse:()=>$,sub:()=>j});function $(e){let r=[],i=0,u=e.length,a=()=>e[i],t=()=>e[i++],o=d=>d===" "||d==="	"||d==="\r",n=d=>d===";"||d===`
`,s=()=>i>=u,p=()=>{for(;!s()&&o(a());)t()},l=()=>{t();let d=1,m=i;for(;!s();){let g=t();if(g==="{")d++;else if(g==="}"&&--d===0)break}return e.slice(m,i-1).trim()},f=()=>{t();let d=1,m=i;for(;!s();){let g=t();if(g==="[")d++;else if(g==="]"&&--d===0)break}return $(e.slice(m,i-1).trim())},c=()=>{t();let d="",m=!1;for(;!s()&&!(!m&&a()==='"');){let g=t();if(g==="\\"&&!m){m=!0;continue}if(m){if(m=!1,g==="n"){d+=`
`;continue}if(g==="t"){d+="	";continue}if(g==="$"){d+="";continue}}d+=g}return s()||t(),d},h=()=>{let d="";for(;!s();){let m=a();if(o(m)||n(m)||m==="#"||m==="["||m==="]"||m==="{"||m==="}"||m==='"')break;d+=t()}return d},y=()=>{let d=[];for(;!s()&&(p(),!s());){let m=a();if(n(m)||m==="#")break;m==="{"?d.push(l()):m==="["?d.push(f()):m==='"'?d.push(c()):d.push(h())}return d};for(;!s()&&(p(),!s());){let d=a();if(n(d)){t();continue}if(d==="#"){for(;!s()&&a()!==`
`;)t();continue}let m=y();m.length>0&&r.push(m)}return r}var S=(e=null)=>({vars:{},parent:e}),v=(e,r)=>{let i=e;for(;i;){if(r in i.vars)return String(i.vars[r]);i=i.parent}return null};function j(e,r){return typeof e!="string"?e:e.replace(/\$([a-zA-Z_][a-zA-Z0-9_-]*)/g,(i,u)=>v(r,u)??i).replace(/\x01/g,"$")}function _(e,r,i){let u=[],a=i.sub??j;for(let t of e){if(!Array.isArray(t)||t.length===0)continue;let o=typeof t[0]=="string"?t[0]:null;if(!o)continue;let n=i.cmds[o];if(!n){console.error(`Unknown command: ${o}`);continue}let p=t.slice(1).map(f=>Array.isArray(f)?_(f,r,i).join(""):a(f,r)),l=n(p,r);if(l?.__khemReturn)return[l.value??""];l!=null&&u.push(String(l))}return u}var w=e=>e&&e!=="0"&&e!=="false",b=e=>Number(e)||0;function x(e){let r=e.cmds;r.text=t=>t[0]??"",r.set=(t,o)=>(o.vars[t[0]]=t[1]??"",null),r.puts=t=>(console.log(t.join(" ")),null),r.if=(t,o)=>{let[n,s,p,l]=t;return w(n)?_($(s),o,e):p==="else"&&l?_($(l),o,e):null},r.for=(t,o)=>{let[n,s,p,l]=t,f=[],c=$(l),h=o.vars[n];for(let y=b(s);y<=b(p);y++)o.vars[n]=String(y),f.push(..._(c,o,e));return h!==void 0?o.vars[n]=h:delete o.vars[n],f},r.foreach=(t,o)=>{let[n,s,p]=t,l=String(s).split(/\s+/).filter(Boolean),f=$(p),c=[],h=o.vars[n];for(let y of l)o.vars[n]=y,c.push(..._(f,o,e));return h!==void 0?o.vars[n]=h:delete o.vars[n],c},r.proc=t=>{let[o,n,s]=t,p=$(s),l=$(n).map(f=>typeof f=="string"?{name:f,default:null}:{name:f[0],default:f[1]??null});return r[o]=(f,c)=>{let h=S(c),y=0;for(let m of l){let g=y<f.length?f[y++]:m.default??"";h.vars[m.name]=g}let d=_(p,h,e);return d.length>0&&d[0]?.__khemReturn?[d[0].value??""]:d},null},r.return=t=>({__khemReturn:!0,value:t[0]??""}),r.list=t=>t.join(" "),r.llength=t=>t[0].split(/\s+/).filter(Boolean).length,r.lindex=t=>t[0].split(/\s+/).filter(Boolean)[b(t[1])]??"",r.lappend=(t,o)=>(o.vars[t[0]]=(o.vars[t[0]]||"")+" "+t.slice(1).join(" "),null),r.concat=t=>t.join(" "),r.join=t=>t.length===2&&t[0].includes(" ")?t[0].split(/\s+/).join(t[1]||" "):t.join(""),r.expr=(t,o)=>{let n=t.join(" ");n=n.replace(/==/g,"===").replace(/!=/g,"!==");try{return String(new Function("return "+n)())}catch{return"0"}},r.incr=(t,o)=>(o.vars[t[0]]=String(b(o.vars[t[0]]||0)+b(t[1]||1)),o.vars[t[0]]),r.abs=t=>String(Math.abs(b(t[0]))),r.round=t=>String(Math.round(b(t[0]))),r.floor=t=>String(Math.floor(b(t[0]))),r.ceil=t=>String(Math.ceil(b(t[0]))),r.sqrt=t=>String(Math.sqrt(b(t[0]))),r.max=t=>String(Math.max(...t.map(b))),r.min=t=>String(Math.min(...t.map(b))),r.string=t=>{let[o,n,...s]=t;switch(o){case"length":return String(n.length);case"index":return n[b(s[0])]||"";case"range":return n.slice(b(s[0]),s[1]?b(s[1])+1:void 0);case"trim":return n.trim();case"toupper":return n.toUpperCase();case"tolower":return n.toLowerCase();case"match":return new RegExp(s[0].replace(/\*/g,".*").replace(/\?/g,".")).test(n)?"1":"0";default:return""}},r.eq=t=>t[0]===t[1]?"1":"0",r.neq=t=>t[0]!==t[1]?"1":"0",r.gt=t=>b(t[0])>b(t[1])?"1":"0",r.lt=t=>b(t[0])<b(t[1])?"1":"0",r.gte=t=>b(t[0])>=b(t[1])?"1":"0",r.lte=t=>b(t[0])<=b(t[1])?"1":"0",r.not=t=>w(t[0])?"0":"1",r.and=t=>w(t[0])&&w(t[1])?"1":"0",r.or=t=>w(t[0])||w(t[1])?"1":"0",r.replace=t=>t[0].replaceAll(t[1],t[2]),r.trim=t=>t[0].trim(),r.upper=t=>t[0].toUpperCase(),r.lower=t=>t[0].toLowerCase(),r.slice=t=>t[0].slice(b(t[1]),t[2]?b(t[2]):void 0),r.contains=t=>t[0].includes(t[1])?"1":"0",r["starts-with"]=t=>t[0].startsWith(t[1])?"1":"0",r["ends-with"]=t=>t[0].endsWith(t[1])?"1":"0",r.today=()=>new Date().toISOString().slice(0,10),r.clock=t=>t[0]==="seconds"?String(Math.floor(Date.now()/1e3)):new Date().toLocaleString(),r.match=(t,o)=>{let n=t[0],s=[];if(t.length===2&&typeof t[1]=="string"){let l=t[1],f=[],c=0;for(;c<l.length;){for(;c<l.length&&/\s/.test(l[c]);)c++;if(c>=l.length)break;let h="";if(l[c]==='"'){for(c++;c<l.length&&l[c]!=='"';)h+=l[c],c++;c<l.length&&c++}else for(;c<l.length&&!/[\s{}]/.test(l[c]);)h+=l[c],c++;for(;c<l.length&&/\s/.test(l[c]);)c++;if(l[c]==="{"){c++;let y=1,d="";for(;c<l.length&&y>0&&(l[c]==="{"&&y++,!(l[c]==="}"&&(y--,y===0)));)d+=l[c],c++;c<l.length&&c++,f.push([h.trim(),d.trim()])}}s=f}else for(let l=1;l<t.length;l++)Array.isArray(t[l])&&t[l].length>=2&&s.push(t[l]);let p=null;for(let[l,f]of s){let c=$(f);if(l==="default"){p=c;continue}if(l===n)return _(c,o,e)}return p?_(p,o,e):null},r.try=(t,o)=>{try{return _($(t[0]),o,e)}catch(n){let s=o.vars.error;if(t[1]==="catch"&&t[2])return o.vars.error=n.message,_($(t[2]),o,e);throw s!==void 0?o.vars.error=s:delete o.vars.error,n}},r.throw=t=>{throw new Error(t[0])},r.dict=t=>{let[o,...n]=t;switch(o){case"create":{let s=[];for(let p=0;p<n.length;p+=2)s.push(n[p],n[p+1]||"");return s.join(" ")}case"get":{let s=n[0].split(/\s+/);for(let p=0;p<s.length;p+=2)if(s[p]===n[1])return s[p+1];return""}case"set":{let s=n[0]?n[0].split(/\s+/):[],p=n[1],l=n[2],f=!1;for(let c=0;c<s.length;c+=2)if(s[c]===p){s[c+1]=l,f=!0;break}return f||s.push(p,l),s.join(" ")}default:return""}};let i=null,u=null,a=()=>typeof process<"u"&&process.versions?.node!=null;a()&&Promise.all([import("node:fs").catch(()=>null),import("node:path").catch(()=>null)]).then(([t,o])=>{t&&(i=t.default??t),o&&(u=o.default??o)}),r.include=([t],o)=>{if(!t)return;if(!a()){console.warn(`include "${t}" skipped \u2014 browser`);return}if(!i||!u){console.error(`include "${t}" skipped \u2014 no fs`);return}let n=e._baseDir??process.cwd(),s=u.resolve(n,t);if(e._includes||(e._includes=new Set),e._includes.has(s))return;e._includes.add(s);let p=e._baseDir;try{e._baseDir=u.dirname(s);let l=i.readFileSync(s,"utf8");_($(l),o,e)}catch(l){console.error(`include error: ${l.message}`)}finally{e._baseDir=p}}}function z(e,r){let i=a=>Array.isArray(a)?_(a,{vars:r.vars,parent:null},r).join(""):String(a),u=(a,t="")=>$(a).map(o=>{let n=o[o.length-1];return typeof n=="string"&&/[;\n]/.test(n)?`${t}${o.slice(0,-1).map(i).join(" ")} { 
${u(n,t+"  ")}${t}}`:`${t}${i(o[0])}: ${o.slice(1).map(i).join(" ")};`}).join(`
`)+`
`;return u(e)}function Z(e,r,i){let u=[];for(let a=0;a<e.length;a++){let t=e[a];if(!Array.isArray(t)||t.length===0)continue;let o=t[0],n=t.slice(1);if(o==="set"){let s=typeof n[0]=="string"?n[0]:"",l=(i&&i[a]?i[a]:t).slice(1);if(n[1]==="expr"&&typeof n[2]=="string"){let c=(typeof l[2]=="string"?l[2]:n[2]).replace(/\$([a-zA-Z_][a-zA-Z0-9_-]*)/g,(h,y)=>`Number(__s[${JSON.stringify(y)}])`);u.push(`__s[${JSON.stringify(s)}]=String((function(){try{return eval(${JSON.stringify(c)})}catch{return 0}})())`)}else{let f=n[1],c=typeof f=="string"?JSON.stringify(f):'""';u.push(`__s[${JSON.stringify(s)}]=${c}`)}}else{let s=n.map(p=>typeof p=="string"?JSON.stringify(p):'""');u.push(`(${o})(${s.join(", ")})`)}}return u.join("; ")}function A(e){let r=e.cmds,i={styles:[]};e._webCtx=i,e._state=e._state||{},r.elem=([u,a],t)=>{if(!u)return"";let o=typeof a=="string"?a:"",n=e._elemAttrs,s=e._elemEvents;e._elemAttrs={},e._elemEvents={};let p;try{p=_($(o),t,e).join("")}catch{p=o}let l={...e._elemAttrs},f={...e._elemEvents};e._elemAttrs=n,e._elemEvents=s;let c="";for(let[y,d]of Object.entries(l))c+=d?` ${y}="${d}"`:` ${y}`;for(let[y,d]of Object.entries(f))c+=` on${y}='${d}'`;return new Set(["br","hr","img","input","meta","link","area","base","col","embed","source","track","wbr"]).has(u)?`<${u}${c}>`:`<${u}${c}>${p}</${u}>`},r.a=([u,a],t)=>{let o=typeof a=="string"?a:"",n=e._elemAttrs,s=e._elemEvents;e._elemAttrs={href:u??"#"},e._elemEvents={};let p;try{p=_($(o),t,e).join("")}catch{p=o}let l={...e._elemAttrs},f={...e._elemEvents};e._elemAttrs=n,e._elemEvents=s;let c="";for(let[h,y]of Object.entries(l))c+=y?` ${h}="${y}"`:` ${h}`;for(let[h,y]of Object.entries(f))c+=` on${h}='${y}'`;return`<a${c}>${p}</a>`},r.attr=([u,a])=>e._elemAttrs?(e._elemAttrs[u]=a??"",null):` ${u}="${a??""}"`,r.on=([u,a])=>{let o=$(typeof a=="string"?a:""),n=Z(o,e,o)+";__render()";return e._elemEvents?(e._elemEvents[u]=n,null):` on${u}='${n}'`},r.state=([u,a])=>(u&&(e._state[u]=a??""),null),r.text=([u])=>{if(!u)return"";let a=e._state;return u.replace(/\x01/g,"").replace(/\$([a-zA-Z_][a-zA-Z0-9_-]*)/g,(t,o)=>o in a?String(a[o]):t).replace(/\x02/g,"$")},r.style=([u])=>(u&&i.styles.push(z(u,e)),null)}function N(e){let r=e._webCtx||{styles:[]},i=e._state||{},u=r.styles.join(`
`),a=e._output||"",t=Object.keys(i),o="";if(t.length>0){let n=(e._source||"").replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/\n/g,"\\n");o=`
var __s=${JSON.stringify(i)};
var __src='${n}';
var __ast=khem.parse(__src);
function __render(){
var _env=khem.createEnvironment(true);
_env._state=__s;
var _scope=khem.createScope();_scope.vars=__s;
document.getElementById('app').innerHTML=khem.evaluate(__ast,_scope,_env).join('');
}
`}return`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${u}</style>
</head>
<body>
  <div id="app">${a}</div>
  ${t.length>0?'<script src="khem-runtime.js"><\/script>':""}
  ${o?`<script>${o}<\/script>`:""}
</body>
</html>`}var T=`proc div {body} { elem "div" "$body" }
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
proc on_keydown {body} { on "keydown" "$body" }`;function F(e=!1){let r={cmds:{},vars:{}};if(x(r),e){A(r);let i=S();_($(T),i,r)}return r}return q(H);})();

function h(e){let r=[],a=0,i=e.length,u=()=>e[a],t=()=>e[a++],n=d=>d===" "||d==="	"||d==="\r",o=d=>d===";"||d===`
`,s=()=>a>=i,p=()=>{for(;!s()&&n(u());)t()},l=()=>{t();let d=1,m=a;for(;!s();){let g=t();if(g==="{")d++;else if(g==="}"&&--d===0)break}return e.slice(m,a-1).trim()},f=()=>{t();let d=1,m=a;for(;!s();){let g=t();if(g==="[")d++;else if(g==="]"&&--d===0)break}return h(e.slice(m,a-1).trim())},c=()=>{t();let d="",m=!1;for(;!s()&&!(!m&&u()==='"');){let g=t();if(g==="\\"&&!m){m=!0;continue}if(m){if(m=!1,g==="n"){d+=`
`;continue}if(g==="t"){d+="	";continue}if(g==="$"){d+="";continue}}d+=g}return s()||t(),d},_=()=>{let d="";for(;!s();){let m=u();if(n(m)||o(m)||m==="#"||m==="["||m==="]"||m==="{"||m==="}"||m==='"')break;d+=t()}return d},y=()=>{let d=[];for(;!s()&&(p(),!s());){let m=u();if(o(m)||m==="#")break;m==="{"?d.push(l()):m==="["?d.push(f()):m==='"'?d.push(c()):d.push(_())}return d};for(;!s()&&(p(),!s());){let d=u();if(o(d)){t();continue}if(d==="#"){for(;!s()&&u()!==`
`;)t();continue}let m=y();m.length>0&&r.push(m)}return r}var S=(e=null)=>({vars:{},parent:e}),N=(e,r)=>{let a=e;for(;a;){if(r in a.vars)return String(a.vars[r]);a=a.parent}return null};function x(e,r){return typeof e!="string"?e:e.replace(/\$([a-zA-Z_][a-zA-Z0-9_-]*)/g,(a,i)=>N(r,i)??a).replace(/\x01/g,"$")}function $(e,r,a){let i=[],u=a.sub??x;for(let t of e){if(!Array.isArray(t)||t.length===0)continue;let n=typeof t[0]=="string"?t[0]:null;if(!n)continue;let o=a.cmds[n];if(!o){console.error(`Unknown command: ${n}`);continue}let p=t.slice(1).map(f=>Array.isArray(f)?$(f,r,a).join(""):u(f,r)),l=o(p,r);if(l?.__khemReturn)return[l.value??""];l!=null&&i.push(String(l))}return i}function O(e,r){return $(e,S(),r).join("")}var w=e=>e&&e!=="0"&&e!=="false",b=e=>Number(e)||0;function j(e){let r=e.cmds;r.text=t=>t[0]??"",r.set=(t,n)=>(n.vars[t[0]]=t[1]??"",null),r.puts=t=>(console.log(t.join(" ")),null),r.if=(t,n)=>{let[o,s,p,l]=t;return w(o)?$(h(s),n,e):p==="else"&&l?$(h(l),n,e):null},r.for=(t,n)=>{let[o,s,p,l]=t,f=[],c=h(l),_=n.vars[o];for(let y=b(s);y<=b(p);y++)n.vars[o]=String(y),f.push(...$(c,n,e));return _!==void 0?n.vars[o]=_:delete n.vars[o],f},r.foreach=(t,n)=>{let[o,s,p]=t,l=String(s).split(/\s+/).filter(Boolean),f=h(p),c=[],_=n.vars[o];for(let y of l)n.vars[o]=y,c.push(...$(f,n,e));return _!==void 0?n.vars[o]=_:delete n.vars[o],c},r.proc=t=>{let[n,o,s]=t,p=h(s),l=h(o).map(f=>typeof f=="string"?{name:f,default:null}:{name:f[0],default:f[1]??null});return r[n]=(f,c)=>{let _=S(c),y=0;for(let m of l){let g=y<f.length?f[y++]:m.default??"";_.vars[m.name]=g}let d=$(p,_,e);return d.length>0&&d[0]?.__khemReturn?[d[0].value??""]:d},null},r.return=t=>({__khemReturn:!0,value:t[0]??""}),r.list=t=>t.join(" "),r.llength=t=>t[0].split(/\s+/).filter(Boolean).length,r.lindex=t=>t[0].split(/\s+/).filter(Boolean)[b(t[1])]??"",r.lappend=(t,n)=>(n.vars[t[0]]=(n.vars[t[0]]||"")+" "+t.slice(1).join(" "),null),r.concat=t=>t.join(" "),r.join=t=>t.length===2&&t[0].includes(" ")?t[0].split(/\s+/).join(t[1]||" "):t.join(""),r.expr=(t,n)=>{let o=t.join(" ");o=o.replace(/==/g,"===").replace(/!=/g,"!==");try{return String(new Function("return "+o)())}catch{return"0"}},r.incr=(t,n)=>(n.vars[t[0]]=String(b(n.vars[t[0]]||0)+b(t[1]||1)),n.vars[t[0]]),r.abs=t=>String(Math.abs(b(t[0]))),r.round=t=>String(Math.round(b(t[0]))),r.floor=t=>String(Math.floor(b(t[0]))),r.ceil=t=>String(Math.ceil(b(t[0]))),r.sqrt=t=>String(Math.sqrt(b(t[0]))),r.max=t=>String(Math.max(...t.map(b))),r.min=t=>String(Math.min(...t.map(b))),r.string=t=>{let[n,o,...s]=t;switch(n){case"length":return String(o.length);case"index":return o[b(s[0])]||"";case"range":return o.slice(b(s[0]),s[1]?b(s[1])+1:void 0);case"trim":return o.trim();case"toupper":return o.toUpperCase();case"tolower":return o.toLowerCase();case"match":return new RegExp(s[0].replace(/\*/g,".*").replace(/\?/g,".")).test(o)?"1":"0";default:return""}},r.eq=t=>t[0]===t[1]?"1":"0",r.neq=t=>t[0]!==t[1]?"1":"0",r.gt=t=>b(t[0])>b(t[1])?"1":"0",r.lt=t=>b(t[0])<b(t[1])?"1":"0",r.gte=t=>b(t[0])>=b(t[1])?"1":"0",r.lte=t=>b(t[0])<=b(t[1])?"1":"0",r.not=t=>w(t[0])?"0":"1",r.and=t=>w(t[0])&&w(t[1])?"1":"0",r.or=t=>w(t[0])||w(t[1])?"1":"0",r.replace=t=>t[0].replaceAll(t[1],t[2]),r.trim=t=>t[0].trim(),r.upper=t=>t[0].toUpperCase(),r.lower=t=>t[0].toLowerCase(),r.slice=t=>t[0].slice(b(t[1]),t[2]?b(t[2]):void 0),r.contains=t=>t[0].includes(t[1])?"1":"0",r["starts-with"]=t=>t[0].startsWith(t[1])?"1":"0",r["ends-with"]=t=>t[0].endsWith(t[1])?"1":"0",r.today=()=>new Date().toISOString().slice(0,10),r.clock=t=>t[0]==="seconds"?String(Math.floor(Date.now()/1e3)):new Date().toLocaleString(),r.match=(t,n)=>{let o=t[0],s=[];if(t.length===2&&typeof t[1]=="string"){let l=t[1],f=[],c=0;for(;c<l.length;){for(;c<l.length&&/\s/.test(l[c]);)c++;if(c>=l.length)break;let _="";if(l[c]==='"'){for(c++;c<l.length&&l[c]!=='"';)_+=l[c],c++;c<l.length&&c++}else for(;c<l.length&&!/[\s{}]/.test(l[c]);)_+=l[c],c++;for(;c<l.length&&/\s/.test(l[c]);)c++;if(l[c]==="{"){c++;let y=1,d="";for(;c<l.length&&y>0&&(l[c]==="{"&&y++,!(l[c]==="}"&&(y--,y===0)));)d+=l[c],c++;c<l.length&&c++,f.push([_.trim(),d.trim()])}}s=f}else for(let l=1;l<t.length;l++)Array.isArray(t[l])&&t[l].length>=2&&s.push(t[l]);let p=null;for(let[l,f]of s){let c=h(f);if(l==="default"){p=c;continue}if(l===o)return $(c,n,e)}return p?$(p,n,e):null},r.try=(t,n)=>{try{return $(h(t[0]),n,e)}catch(o){let s=n.vars.error;if(t[1]==="catch"&&t[2])return n.vars.error=o.message,$(h(t[2]),n,e);throw s!==void 0?n.vars.error=s:delete n.vars.error,o}},r.throw=t=>{throw new Error(t[0])},r.dict=t=>{let[n,...o]=t;switch(n){case"create":{let s=[];for(let p=0;p<o.length;p+=2)s.push(o[p],o[p+1]||"");return s.join(" ")}case"get":{let s=o[0].split(/\s+/);for(let p=0;p<s.length;p+=2)if(s[p]===o[1])return s[p+1];return""}case"set":{let s=o[0]?o[0].split(/\s+/):[],p=o[1],l=o[2],f=!1;for(let c=0;c<s.length;c+=2)if(s[c]===p){s[c+1]=l,f=!0;break}return f||s.push(p,l),s.join(" ")}default:return""}};let a=null,i=null,u=()=>typeof process<"u"&&process.versions?.node!=null;u()&&Promise.all([import("node:fs").catch(()=>null),import("node:path").catch(()=>null)]).then(([t,n])=>{t&&(a=t.default??t),n&&(i=n.default??n)}),r.include=([t],n)=>{if(!t)return;if(!u()){console.warn(`include "${t}" skipped \u2014 browser`);return}if(!a||!i){console.error(`include "${t}" skipped \u2014 no fs`);return}let o=e._baseDir??process.cwd(),s=i.resolve(o,t);if(e._includes||(e._includes=new Set),e._includes.has(s))return;e._includes.add(s);let p=e._baseDir;try{e._baseDir=i.dirname(s);let l=a.readFileSync(s,"utf8");$(h(l),n,e)}catch(l){console.error(`include error: ${l.message}`)}finally{e._baseDir=p}}}function L(e,r){let a=u=>Array.isArray(u)?$(u,{vars:r.vars,parent:null},r).join(""):String(u),i=(u,t="")=>h(u).map(n=>{let o=n[n.length-1];return typeof o=="string"&&/[;\n]/.test(o)?`${t}${n.slice(0,-1).map(a).join(" ")} { 
${i(o,t+"  ")}${t}}`:`${t}${a(n[0])}: ${n.slice(1).map(a).join(" ")};`}).join(`
`)+`
`;return i(e)}function B(e,r,a){let i=[];for(let u=0;u<e.length;u++){let t=e[u];if(!Array.isArray(t)||t.length===0)continue;let n=t[0],o=t.slice(1);if(n==="set"){let s=typeof o[0]=="string"?o[0]:"",l=(a&&a[u]?a[u]:t).slice(1);if(o[1]==="expr"&&typeof o[2]=="string"){let c=(typeof l[2]=="string"?l[2]:o[2]).replace(/\$([a-zA-Z_][a-zA-Z0-9_-]*)/g,(_,y)=>`Number(__s[${JSON.stringify(y)}])`);i.push(`__s[${JSON.stringify(s)}]=String((function(){try{return eval(${JSON.stringify(c)})}catch{return 0}})())`)}else{let f=o[1],c=typeof f=="string"?JSON.stringify(f):'""';i.push(`__s[${JSON.stringify(s)}]=${c}`)}}else{let s=o.map(p=>typeof p=="string"?JSON.stringify(p):'""');i.push(`(${n})(${s.join(", ")})`)}}return i.join("; ")}function A(e){let r=e.cmds,a={styles:[]};e._webCtx=a,e._state=e._state||{},r.elem=([i,u],t)=>{if(!i)return"";let n=typeof u=="string"?u:"",o=e._elemAttrs,s=e._elemEvents;e._elemAttrs={},e._elemEvents={};let p;try{p=$(h(n),t,e).join("")}catch{p=n}let l={...e._elemAttrs},f={...e._elemEvents};e._elemAttrs=o,e._elemEvents=s;let c="";for(let[y,d]of Object.entries(l))c+=d?` ${y}="${d}"`:` ${y}`;for(let[y,d]of Object.entries(f))c+=` on${y}='${d}'`;return new Set(["br","hr","img","input","meta","link","area","base","col","embed","source","track","wbr"]).has(i)?`<${i}${c}>`:`<${i}${c}>${p}</${i}>`},r.a=([i,u],t)=>{let n=typeof u=="string"?u:"",o=e._elemAttrs,s=e._elemEvents;e._elemAttrs={href:i??"#"},e._elemEvents={};let p;try{p=$(h(n),t,e).join("")}catch{p=n}let l={...e._elemAttrs},f={...e._elemEvents};e._elemAttrs=o,e._elemEvents=s;let c="";for(let[_,y]of Object.entries(l))c+=y?` ${_}="${y}"`:` ${_}`;for(let[_,y]of Object.entries(f))c+=` on${_}='${y}'`;return`<a${c}>${p}</a>`},r.attr=([i,u])=>e._elemAttrs?(e._elemAttrs[i]=u??"",null):` ${i}="${u??""}"`,r.on=([i,u])=>{let n=h(typeof u=="string"?u:""),o=B(n,e,n)+";__render()";return e._elemEvents?(e._elemEvents[i]=o,null):` on${i}='${o}'`},r.state=([i,u])=>(i&&(e._state[i]=u??""),null),r.text=([i])=>{if(!i)return"";let u=e._state;return i.replace(/\x01/g,"").replace(/\$([a-zA-Z_][a-zA-Z0-9_-]*)/g,(t,n)=>n in u?String(u[n]):t).replace(/\x02/g,"$")},r.style=([i])=>(i&&a.styles.push(L(i,e)),null)}function E(e){let r=e._webCtx||{styles:[]},a=e._state||{},i=r.styles.join(`
`),u=e._output||"",t=Object.keys(a),n="";if(t.length>0){let o=(e._source||"").replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/\n/g,"\\n");n=`
var __s=${JSON.stringify(a)};
var __src='${o}';
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
  <style>${i}</style>
</head>
<body>
  <div id="app">${u}</div>
  ${t.length>0?'<script src="khem-runtime.js"><\/script>':""}
  ${n?`<script>${n}<\/script>`:""}
</body>
</html>`}function k(e=!1){let r={cmds:{},vars:{}};return j(r),e&&A(r),r}function Y(e,r=k()){return $(h(e),{vars:r.vars,parent:null},r).join("")}function G(e,r){let a=k(!0);r&&(a._baseDir=r),a._source=e;let i=C();if(i){let t={vars:a.vars,parent:null};$(h(i),t,a)}let u={vars:a.vars,parent:null};return a._output=$(h(e),u,a).join(""),E(a)}function V(e){let r=k(!0),a=C();if(a){let i={vars:r.vars,parent:null};$(h(a),i,r)}return e.replace(/<script\s+type="text\/khem"[^>]*>([\s\S]*?)<\/script>/gi,(i,u)=>{try{let t={vars:r.vars,parent:null};return $(h(u.trim()),t,r).join("")}catch(t){return console.error("Khem script error:",t),`<!-- Error: ${t.message} -->`}})}var v=null;function C(){return v||(v=J,v)}var J=`proc div {body} { elem "div" "$body" }
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
proc on_keydown {body} { on "keydown" "$body" }`;export{k as createEnvironment,S as createScope,$ as evaluate,h as parse,V as processScriptTags,O as render,G as renderForWeb,Y as run,x as sub};

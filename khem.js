var E=class l{static Reactivity=class{constructor(){this.currentEffect=null}createSignal(t){let r=t,n=new Set;return{read:()=>(this.currentEffect&&n.add(this.currentEffect),r),write:o=>{r=o,n.forEach(a=>a())},isSignal:!0}}createEffect(t){this.currentEffect=t,t(),this.currentEffect=null}};static Parser=class{static lex(t){let r=[],n=0,i=t.length,s=()=>t[n],o=()=>t[n++],a=m=>m===" "||m==="	"||m==="\r",c=m=>m===";"||m===`
`,e=()=>n>=i,u=()=>{for(;!e()&&a(s());)o()},p=()=>{o();let m=1,g=n;for(;!e();){let y=o();if(y==="{")m++;else if(y==="}"&&--m===0)break}return t.slice(g,n-1).trim()},d=()=>{o();let m=1,g=n;for(;!e();){let y=o();if(y==="[")m++;else if(y==="]"&&--m===0)break}return l.Parser.lex(t.slice(g,n-1).trim())},f=()=>{o();let m="",g=!1;for(;!e()&&!(!g&&s()==='"');){let y=o();if(y==="\\"&&!g){g=!0;continue}if(g){if(g=!1,y==="n"){m+=`
`;continue}if(y==="t"){m+="	";continue}if(y==="$"){m+="";continue}}m+=y}return e()||o(),m},S=()=>{let m="";for(;!e();){let g=s();if(a(g)||c(g)||g==="#"||g==="["||g==="]"||g==="{"||g==="}"||g==='"')break;m+=o()}return m},h=()=>{let m=[];for(;!e()&&(u(),!e());){let g=s();if(c(g)||g==="#")break;g==="{"?m.push(p()):g==="["?m.push(d()):g==='"'?m.push(f()):m.push(S())}return m};for(;!e()&&(u(),!e());){let m=s();if(c(m)){o();continue}if(m==="#"){for(;!e()&&s()!==`
`;)o();continue}let g=h();g.length>0&&r.push(g)}return r}};static Scope=class{constructor(t,r){this.vars=new Map,this.commands=new Map,this.parent=t||null,this.reactivity=r}set(t,r){this.vars.has(t)&&this.vars.get(t).isSignal?this.vars.get(t).write(r):this.vars.set(t,this.reactivity.createSignal(r))}get(t){if(this.vars.has(t))return this.vars.get(t).read();if(this.parent)return this.parent.get(t);throw new Error(`[Khem] Variable '${t}' not defined.`)}has(t){return this.vars.has(t)}delete(t){this.vars.delete(t)}lookup(t){let r=this;for(;r;){if(r.vars.has(t))return String(r.vars.get(t).read());r=r.parent}return null}resolve(t){if(this.commands.has(t))return this.commands.get(t);if(this.parent)return this.parent.resolve(t)}register(t,r){this.commands.set(t,r)}};static VM=class{constructor(t){this.scope=t}sub(t){return typeof t!="string"?t:t.replace(/\$([a-zA-Z_][a-zA-Z0-9_-]*)/g,(r,n)=>this.scope.lookup(n)??r).replace(/\x01/g,"$")}evaluate(t,r){let n=typeof t=="string"?l.Parser.lex(t):t,i=this.scope;r&&(this.scope=r);let s=[];try{for(let o of n){if(!Array.isArray(o)||o.length===0)continue;let a=typeof o[0]=="string"?o[0]:null;if(!a)continue;let c=this.scope.resolve(a);if(!c){console.error(`Unknown command: ${a}`);continue}let u=o.slice(1).map(d=>Array.isArray(d)?this.evaluate(d).join(""):this.sub(d)),p=c(u,this);if(p?.__khemReturn)return[p.value??""];p!=null&&s.push(String(p))}}finally{this.scope=i}return s}};static StdLib=class{static register(t){let r=t.scope.commands,n=t._khem,i=e=>e&&e!=="0"&&e!=="false",s=e=>Number(e)||0;r.set("text",e=>e[0]??""),r.set("set",e=>(t.scope.set(e[0],e[1]??""),null)),r.set("puts",e=>(console.log(e.join(" ")),null)),r.set("if",e=>{let[u,p,d,f]=e;return i(u)?t.evaluate(p):d==="else"&&f?t.evaluate(f):null}),r.set("for",e=>{let[u,p,d,f]=e,S=[],h=l.Parser.lex(f),m=t.scope.has(u),g=m?t.scope.vars.get(u):void 0;for(let y=s(p);y<=s(d);y++)t.scope.set(u,String(y)),S.push(...t.evaluate(h));return m?t.scope.vars.set(u,g):t.scope.delete(u),S}),r.set("foreach",e=>{let[u,p,d]=e,f=String(p).split(/\s+/).filter(Boolean),S=l.Parser.lex(d),h=[],m=t.scope.has(u),g=m?t.scope.vars.get(u):void 0;for(let y of f)t.scope.set(u,y),h.push(...t.evaluate(S));return m?t.scope.vars.set(u,g):t.scope.delete(u),h}),r.set("proc",e=>{let[u,p,d]=e,f=l.Parser.lex(d),S=l.Parser.lex(p).map(h=>typeof h=="string"?{name:h,default:null}:{name:h[0],default:h[1]??null});return t.scope.commands.set(u,(h,m)=>{let g=m.scope,y=new l.Scope(g,g.reactivity),M=0;for(let O of S){let J=M<h.length?h[M++]:O.default??"";y.set(O.name,J)}let w=m.evaluate(f,y);return w.length>0&&w[0]?.__khemReturn?[w[0].value??""]:w}),null}),r.set("return",e=>({__khemReturn:!0,value:e[0]??""})),r.set("list",e=>e.join(" ")),r.set("llength",e=>e[0].split(/\s+/).filter(Boolean).length),r.set("lindex",e=>e[0].split(/\s+/).filter(Boolean)[s(e[1])]??""),r.set("lappend",e=>{let u=t.scope.has(e[0])&&t.scope.get(e[0])||"";return t.scope.set(e[0],u+" "+e.slice(1).join(" ")),null}),r.set("concat",e=>e.join(" ")),r.set("join",e=>e.length===2&&e[0].includes(" ")?e[0].split(/\s+/).join(e[1]||" "):e.join("")),r.set("expr",e=>{let u=e.join(" ");u=u.replace(/==/g,"===").replace(/!=/g,"!==");try{return String(new Function("return "+u)())}catch{return"0"}}),r.set("incr",e=>{let u=t.scope.has(e[0])&&t.scope.get(e[0])||"0",p=String(s(u)+s(e[1]||1));return t.scope.set(e[0],p),p}),r.set("abs",e=>String(Math.abs(s(e[0])))),r.set("round",e=>String(Math.round(s(e[0])))),r.set("floor",e=>String(Math.floor(s(e[0])))),r.set("ceil",e=>String(Math.ceil(s(e[0])))),r.set("sqrt",e=>String(Math.sqrt(s(e[0])))),r.set("max",e=>String(Math.max(...e.map(s)))),r.set("min",e=>String(Math.min(...e.map(s)))),r.set("string",e=>{let[u,p,...d]=e;switch(u){case"length":return String(p.length);case"index":return p[s(d[0])]||"";case"range":return p.slice(s(d[0]),d[1]?s(d[1])+1:void 0);case"trim":return p.trim();case"toupper":return p.toUpperCase();case"tolower":return p.toLowerCase();case"match":return new RegExp(d[0].replace(/\*/g,".*").replace(/\?/g,".")).test(p)?"1":"0";default:return""}}),r.set("eq",e=>e[0]===e[1]?"1":"0"),r.set("neq",e=>e[0]!==e[1]?"1":"0"),r.set("gt",e=>s(e[0])>s(e[1])?"1":"0"),r.set("lt",e=>s(e[0])<s(e[1])?"1":"0"),r.set("gte",e=>s(e[0])>=s(e[1])?"1":"0"),r.set("lte",e=>s(e[0])<=s(e[1])?"1":"0"),r.set("not",e=>i(e[0])?"0":"1"),r.set("and",e=>i(e[0])&&i(e[1])?"1":"0"),r.set("or",e=>i(e[0])||i(e[1])?"1":"0"),r.set("replace",e=>e[0].replaceAll(e[1],e[2])),r.set("trim",e=>e[0].trim()),r.set("upper",e=>e[0].toUpperCase()),r.set("lower",e=>e[0].toLowerCase()),r.set("slice",e=>e[0].slice(s(e[1]),e[2]?s(e[2]):void 0)),r.set("contains",e=>e[0].includes(e[1])?"1":"0"),r.set("starts-with",e=>e[0].startsWith(e[1])?"1":"0"),r.set("ends-with",e=>e[0].endsWith(e[1])?"1":"0"),r.set("today",()=>new Date().toISOString().slice(0,10)),r.set("clock",e=>e[0]==="seconds"?String(Math.floor(Date.now()/1e3)):new Date().toLocaleString()),r.set("match",e=>{let u=e[0],p=[];if(e.length===2&&typeof e[1]=="string"){let f=e[1],S=[],h=0;for(;h<f.length;){for(;h<f.length&&/\s/.test(f[h]);)h++;if(h>=f.length)break;let m="";if(f[h]==='"'){for(h++;h<f.length&&f[h]!=='"';)m+=f[h],h++;h<f.length&&h++}else for(;h<f.length&&!/[\s{}]/.test(f[h]);)m+=f[h],h++;for(;h<f.length&&/\s/.test(f[h]);)h++;if(f[h]==="{"){h++;let g=1,y="";for(;h<f.length&&g>0&&(f[h]==="{"&&g++,!(f[h]==="}"&&(g--,g===0)));)y+=f[h],h++;h<f.length&&h++,S.push([m.trim(),y.trim()])}}p=S}else for(let f=1;f<e.length;f++)Array.isArray(e[f])&&e[f].length>=2&&p.push(e[f]);let d=null;for(let[f,S]of p){let h=l.Parser.lex(S);if(f==="default"){d=h;continue}if(f===u)return t.evaluate(h)}return d?t.evaluate(d):null}),r.set("try",e=>{try{return t.evaluate(l.Parser.lex(e[0]))}catch(u){let p=t.scope.has("error"),d=p?t.scope.vars.get("error"):void 0;if(e[1]==="catch"&&e[2]){t.scope.set("error",u.message);let f=t.evaluate(l.Parser.lex(e[2]));return p?t.scope.vars.set("error",d):t.scope.delete("error"),f}throw p?t.scope.vars.set("error",d):t.scope.delete("error"),u}}),r.set("throw",e=>{throw new Error(e[0])}),r.set("dict",e=>{let[u,...p]=e;switch(u){case"create":{let d=[];for(let f=0;f<p.length;f+=2)d.push(p[f],p[f+1]||"");return d.join(" ")}case"get":{let d=p[0].split(/\s+/);for(let f=0;f<d.length;f+=2)if(d[f]===p[1])return d[f+1];return""}case"set":{let d=p[0]?p[0].split(/\s+/):[],f=p[1],S=p[2],h=!1;for(let m=0;m<d.length;m+=2)if(d[m]===f){d[m+1]=S,h=!0;break}return h||d.push(f,S),d.join(" ")}default:return""}});let o=null,a=null,c=()=>typeof process<"u"&&process.versions?.node!=null;c()&&Promise.all([import("node:fs").catch(()=>null),import("node:path").catch(()=>null)]).then(([e,u])=>{e&&(o=e.default??e),u&&(a=u.default??u)}),r.set("include",([e])=>{if(!e)return;if(!c()){console.warn(`include "${e}" skipped \u2014 browser`);return}if(!o||!a){console.error(`include "${e}" skipped \u2014 no fs`);return}let u=n._baseDir??process.cwd(),p=a.resolve(u,e);if(n._includes||(n._includes=new Set),n._includes.has(p))return;n._includes.add(p);let d=n._baseDir;try{n._baseDir=a.dirname(p);let f=o.readFileSync(p,"utf8");t.evaluate(l.Parser.lex(f))}catch(f){console.error(`include error: ${f.message}`)}finally{n._baseDir=d}})}};constructor(){this.reactivity=new l.Reactivity,this.scope=new l.Scope(null,this.reactivity),this.vm=new l.VM(this.scope),this.vm._khem=this,this._state={},this._webCtx=null,this._output="",this._source="",this._baseDir=null,this._includes=null,this._elemAttrs=null,this._elemEvents=null,l.StdLib.register(this.vm)}register(t,r){this.scope.register(t,r)}run(t){return this.vm.evaluate(t).join("")}createEffect(t){this.reactivity.createEffect(t)}get vars(){let t=this.scope;return new Proxy(this.scope.vars,{get(r,n){if(typeof n=="string"&&t.has(n))return t.get(n)},set(r,n,i){return t.set(n,i),!0},has(r,n){return t.has(n)}})}},$=E;var W=$.Parser.lex,_=new Set(["br","hr","img","input","meta","link","area","base","col","embed","source","track","wbr"]),A=new Set(["div","span","p","h1","h2","h3","h4","h5","h6","ul","ol","li","table","tr","td","th","section","main","header","footer","nav","article","form","pre","code","blockquote","strong","em","button","input","a"]),v=/\$([a-zA-Z_][a-zA-Z0-9_-]*)/g,K=new Set(["break","case","catch","continue","debugger","default","delete","do","else","finally","for","function","if","in","instanceof","new","return","switch","throw","try","typeof","var","void","while","with","class","const","enum","export","extends","import","super","implements","interface","let","package","private","protected","public","static","yield","await","async"]);function z(l){return K.has(l)?"_"+l:l}function b(l){return JSON.stringify(String(l))}function k(l,t){let r=i=>Array.isArray(i)?t?t(i):i.join(" "):String(i);function n(i,s=""){return W(i).map(o=>{let a=o[o.length-1];if(typeof a=="string"&&/[;\n]/.test(a)){let c=o.slice(0,-1).map(r).join(" ");return`${s}${c} {
${n(a,s+"  ")}${s}}`}return`${s}${r(o[0])}: ${o.slice(1).map(r).join(" ")};`}).join(`
`)+`
`}return n(l)}var x=$.Parser.lex,V=new Set(["class","id","href","src","type","value","placeholder"]),U=new Set(["proc","set","on","state","style"]),j=class{constructor(t){this.ast=t,this.state={},this.cssBlocks=[],this.procs=[],this.renderCmds=[],this.procNames=new Set}ref(t,r){let n=t.startsWith("$")?t.slice(1):t;return r instanceof Map&&r.has(n)?r.get(n):r instanceof Set&&r.has(n)?n:`__s.${n}`}exprSub(t,r){return t.replace(v,(n,i)=>`Number(${this.ref(i,r)})`)}contentSub(t,r){return t.replace(/\x01([a-zA-Z_][a-zA-Z0-9_-]*)/g,(n,i)=>`$${i}`).replace(v,(n,i)=>`"+${this.ref(i,r)}+"`).replace(/\x02/g,"$")}argSub(t,r){return t.replace(/\x01([a-zA-Z_][a-zA-Z0-9_-]*)/g,(n,i)=>`$${i}`).replace(v,(n,i)=>this.ref(i,r)).replace(/\x02/g,"$")}compilePart(t,r,n="text"){if(typeof t=="string"){if(n==="attr"){let s=this.argSub(t,r);return s===t?b(t):s}let i=this.contentSub(t,r);return i===t?b(t):i.includes('"')?b(i):`"${i}"`}if(Array.isArray(t)){let i=Array.isArray(t[0])?t[0]:t;if(i.length>=1){let s=i[0],o=i.slice(1).map(a=>typeof a=="string"?n==="attr"?this.argSub(a,r)===a?b(a):this.argSub(a,r):this.compilePart(a,r,n):this.compilePart(a,r,n));return`${s}(${o.join(", ")})`}return b(String(t))}return b(String(t))}compileSet(t,r,n,i="render"){let s=t.slice(1),o=(s[0]||"").startsWith("$")?s[0].slice(1):s[0]||"",a=r instanceof Map&&r.has(o)?`__s[${r.get(o)}]`:`__s.${o}`;if(s[1]==="expr"&&typeof s[2]=="string"){let c=this.exprSub(s[2],r),e=i==="event"?`"${c.replace(/"/g,'\\"')}"`:b(c);n.push(`${a}=String((function(){try{return eval(${e})}catch{return 0}})())`)}else if(s[1]==="expr"&&Array.isArray(s[2])){let c=s[2];if(c.length>=1&&Array.isArray(c[0])){let e=c[0],u=e[0],p=e.slice(1).map(d=>typeof d=="string"?this.argSub(d,r)===d?b(d):this.argSub(d,r):this.compilePart(d,r,"attr"));n.push(`${a}=String((function(){try{return eval(${u}(${p.join(", ")}))}catch{return 0}})())`)}else n.push(`${a}=String(${b(String(c))})`)}else if(i==="event"){let c=String(s[1]??"").replace(/'/g,"\\'").replace(/"/g,'\\"');n.push(`${a}=String("${c}")`)}else n.push(`${a}=${b(s[1]??"")}`)}compileEvent(t,r){let n=t[0]==="on"?t[1]:t[0].slice(3),i=t[0]==="on"?t[2]:t[1],s=x(typeof i=="string"?i:""),o=[];for(let a of s){if(!Array.isArray(a)||a.length===0)continue;let c=a[0];if(c==="set")this.compileSet(a,r,o,"event");else if(c==="if")this.compileIfEvent(a,r,o);else if(typeof c=="string"){let e=a.slice(1).map(u=>typeof u=="string"?b(u):"String("+this.compilePart(u,r)+")");o.push(`${c}(${e.join(", ")})`)}}return o.push("__r()"),` on${n}='${o.join(";")}'`}compileIfEvent(t,r,n){let i=typeof t[1]=="string"?t[1].replace(v,(o,a)=>this.ref(a,r)):b(t[1]),s=o=>{let a=x(typeof o=="string"?o:""),c=[];for(let e of a)Array.isArray(e)&&e[0]==="set"&&this.compileSet(e,r,c,"event");return c};if(t[4]==="else"&&t[5]){let o=s(t[3]),a=s(t[5]);(o.length||a.length)&&n.push(`(${i})?(${o.join(";")}):(${a.join(";")})`)}else{let o=s(t[3]);o.length&&n.push(`(${i})&&(${o.join(";")})`)}}extractAttrs(t,r){let n=x(typeof t=="string"?t:""),i="",s=[],o=[];for(let a of n){if(!Array.isArray(a)||a.length===0)continue;let c=a[0],e=a.slice(1);if(c==="on"||c.startsWith("on_"))s.push({expr:this.compileEvent(a,r)});else if(V.has(c)){let u=e[0];Array.isArray(u)?s.push({name:c,expr:this.compilePart(u,r,"attr")}):i+=` ${c}=${b(u??"")}`}else c==="data"?i+=` data-${e[0]??""}=${b(e[1]??"")}`:c==="attr"?i+=` ${e[0]??""}=${b(e[1]??"")}`:o.push(a)}return{staticAttrs:i,dynamicAttrs:s,contentCmds:o}}compileElement(t,r,n){let{staticAttrs:i,dynamicAttrs:s,contentCmds:o}=this.extractAttrs(r,n),a=this.compileBody(o,n),c=`<${t}${i}>`,e=_.has(t)?"":`</${t}>`;if(s.length===0)return _.has(t)?b(c):`${b(c)} + ${a} + ${b(e)}`;let u=[b(`<${t}${i}`)];for(let p of s)p.name?(u.push(b(` ${p.name}="`)),u.push(p.expr),u.push(b('"'))):u.push(b(p.expr));return u.push(b(">")),_.has(t)||u.push(` + ${a} + ${b(e)}`),u.join(" + ")}compileIf(t,r){let n=typeof t[0]=="string"?this.contentSub(t[0],r):b(t[0]),i=this.compileBody(t[2],r);if(t[3]==="else"&&t[4]){let s=this.compileBody(t[4],r);return`((${n}) ? (${i}) : (${s}))`}return`((${n}) ? (${i}) : (""))`}compileFor(t,r){let n=t[0]||"i",i=typeof t[1]=="string"?this.contentSub(t[1],r):b(t[1]),s=typeof t[2]=="string"?this.contentSub(t[2],r):b(t[2]),o=new Set(r);o.add(n);let a=this.compileBody(t[3],o);return`(function(){var __r="";for(var ${n}=Number(${i});${n}<=Number(${s});${n}++){__r+=${a}}return __r})()`}compileForeach(t,r){let n=t[0]||"v",i=typeof t[1]=="string"?this.contentSub(t[1],r):b(t[1]),s=new Set(r);s.add(n);let o=this.compileBody(t[2],s);return`(function(){var __r="";(${i}).split(" ").forEach(function(${n}){__r+=${o}});return __r})()`}compileMatch(t,r){let n=typeof t[0]=="string"?this.exprSub(t[0],r):b(t[0]),i=x(t[1]||""),s='""';for(let o=i.length-1;o>=0;o--){let a=i[o];if(!Array.isArray(a)||a.length<2)continue;let c=this.compileBody(a[1],r);a[0]==="default"?s=c:s=`((${n} == ${a[0]}) ? (${c}) : (${s}))`}return`(${s})`}compileCmd(t,r){if(!Array.isArray(t)||t.length===0)return null;let n=t[0],i=t.slice(1);switch(n){case"text":return this.compileText(i,r);case"elem":return this.compileElement(i[0]||"div",i[1]||"",r);case"if":return this.compileIf(i,r);case"for":return this.compileFor(i,r);case"foreach":return this.compileForeach(i,r);case"match":return this.compileMatch(i,r);default:return U.has(n)?null:this.compileDefault(n,i,r)}}compileText(t,r){let n=/(?=\$[a-zA-Z_][a-zA-Z0-9_-]*)/,i=t.flatMap(s=>typeof s=="string"?s.split(n).map(o=>o?o.startsWith("$")?this.ref(o,r):b(o):null).filter(Boolean):[this.compilePart(s,r,"attr")]);return i.length===0?b(""):i.join(" + ")}compileDefault(t,r,n){if(A.has(t))return this.compileElement(t,r[0]||"",n);if(t==="br"||t==="hr")return b(`<${t}>`);if(t==="img")return b(`<img src=${b(r[0]??"")} alt=${b(r[1]??"")}>`);if(this.procNames.has(t)){let i=r.map(s=>typeof s=="string"?s.includes("$")?this.argSub(s,n):b(s):this.compilePart(s,n,"attr"));return`${t}(${i.join(", ")})`}return null}compileBody(t,r){let n=typeof t=="string"?x(t):t,i=[];for(let s of n){let o=this.compileCmd(s,r);o!==null&&i.push(o)}return i.length===0?'""':i.join(" + ")}compileProcBody(t,r){let n=typeof t=="string"?x(t):t,i=[],s=[],o=!1;for(let c of n)if(!(!Array.isArray(c)||c.length===0))if(c[0]==="set")o=!0,this.compileSet(c,r,i);else{let e=this.compileCmd(c,r);e!==null&&s.push(e)}if(!o)return s.length===0?'""':s.join(" + ");let a=["(function(){var __r='';"];for(let c of i)a.push(c+";");for(let c of s)a.push("__r+="+c+";");return a.push("return __r})()"),a.join("")}compileProc(t){let r=t[1],n=t[2]||"",i=t[3],s=new Map,o=n.split(/[;\s]+/).filter(Boolean).map(a=>{let c=z(a);return s.set(a,c),c});return`function ${r}(${o.join(", ")}){return ${this.compileProcBody(i,s)}}`}compile(){for(let c of this.ast){if(!Array.isArray(c)||c.length===0)continue;let e=c[0];e==="state"?this.state[c[1]]=c[2]??"":e==="style"?this.cssBlocks.push(k(c[1]||"")):e==="proc"?this.procs.push(c):this.renderCmds.push(c)}this.procNames=new Set(this.procs.map(c=>c[1]));let t=this.procs.map(c=>this.compileProc(c)),r=this.renderCmds.filter(c=>Array.isArray(c)&&c[0]==="set"),n=this.renderCmds.filter(c=>!(Array.isArray(c)&&c[0]==="set"));for(let c of r){let e=c.slice(1),u=e[0]||"";this.state[u]=e[1]==="expr"&&typeof e[2]=="string"?e[2]:e[1]??""}let i=new Set,s=n.map(c=>this.compileCmd(c,i)).filter(c=>c!==null),o=s.length===0?'function render(){return ""}':`function render(){return ${s.join(" + ")}}`,a=[];return Object.keys(this.state).length>0&&a.push(`var __s=${JSON.stringify(this.state)};`),t.length&&a.push(t.join(`
`)),a.push(o),a.push("function __diff(a,b){if(!a||!b)return;if(a.nodeType===3){if(a.textContent!==b.textContent)a.textContent=b.textContent;return;}if(a.tagName!==b.tagName){a.parentNode.replaceChild(b.cloneNode(true),a);return;}var i;for(i=0;i<b.attributes.length;i++)a.setAttribute(b.attributes[i].name,b.attributes[i].value);var ac=Array.from(a.childNodes),bc=Array.from(b.childNodes);for(i=0;i<Math.max(ac.length,bc.length);i++){if(i>=ac.length)a.appendChild(bc[i].cloneNode(true));else if(i>=bc.length)a.removeChild(ac[i]);else __diff(ac[i],bc[i]);}}"),a.push("function __r(){var t=document.createElement('div');t.innerHTML=render();__diff(document.getElementById('app'),t);}"),a.push("document.getElementById('app').innerHTML=render();"),{html:"",css:this.cssBlocks.join(`
`),js:a.join(`
`)}}};function L(l){return new j(l).compile()}var C=`:root {
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
`;var I=$.Parser.lex;function P(l){let t={attrs:l._elemAttrs,events:l._elemEvents};return l._elemAttrs={},l._elemEvents={},t}function N(l,t){let r={...l._elemAttrs},n={...l._elemEvents};return l._elemAttrs=t.attrs,l._elemEvents=t.events,{attrs:r,events:n}}function F(l,t){let r=typeof l=="string"?l:"";try{return t.evaluate(r).join("")}catch{return r}}function T(l,t){let r="";for(let[n,i]of Object.entries(l))r+=i?` ${n}="${i}"`:` ${n}`;for(let[n,i]of Object.entries(t))r+=` on${n}='${i}'`;return r}function D(l,t,r,n){let i=P(n),s=F(t,r),{attrs:o,events:a}=N(n,i),c=T(o,a);return _.has(l)?`<${l}${c}>`:`<${l}${c}>${s}</${l}>`}function R(l){let t=l.scope.commands,r={styles:[]};l._webCtx=r,l._state=l._state||{};let n=l.vm;t.set("elem",([s,o])=>D(s||"div",o,n,l)),t.set("a",([s,o])=>{let a=P(l);l._elemAttrs={href:s??"#"};let c=F(o,n),{attrs:e,events:u}=N(l,a);return`<a${T(e,u)}>${c}</a>`}),t.set("img",([s,o])=>{let a=P(l);l._elemAttrs={src:s??"",alt:o??""};let{attrs:c}=N(l,a);return`<img${T(c,{})}>`});for(let s of A)s==="a"||s==="img"||t.set(s,([o])=>D(s,o,n,l));t.set("br",()=>"<br>"),t.set("hr",()=>"<hr>"),t.set("attr",([s,o])=>l._elemAttrs?(l._elemAttrs[s]=o??"",null):` ${s}="${o??""}"`),t.set("class",([s])=>t.get("attr")(["class",s])),t.set("id",([s])=>t.get("attr")(["id",s])),t.set("data",([s,o])=>t.get("attr")([`data-${s}`,o])),t.set("href",([s])=>t.get("attr")(["href",s])),t.set("src",([s])=>t.get("attr")(["src",s])),t.set("type",([s])=>t.get("attr")(["type",s])),t.set("value",([s])=>t.get("attr")(["value",s])),t.set("placeholder",([s])=>t.get("attr")(["placeholder",s])),t.set("on",([s,o])=>{let c=I(typeof o=="string"?o:""),e=[];for(let p of c)if(!(!Array.isArray(p)||p.length===0)&&p[0]==="set"){let d=p[1]||"";if(p[2]==="expr"&&typeof p[3]=="string"){let f=p[3].replace(/\$([a-zA-Z_][a-zA-Z0-9_-]*)/g,(S,h)=>`Number(__s[${JSON.stringify(h)}])`);e.push(`__s[${JSON.stringify(d)}]=String((function(){try{return eval(${JSON.stringify(f)})}catch{return 0}})())`)}else e.push(`__s[${JSON.stringify(d)}]=${JSON.stringify(p[2]??"")}`)}e.push("__render()");let u=e.join(";");return l._elemEvents?(l._elemEvents[s]=u,null):` on${s}='${u}'`}),t.set("on_click",([s])=>t.get("on")(["click",s])),t.set("on_input",([s])=>t.get("on")(["input",s])),t.set("on_change",([s])=>t.get("on")(["change",s])),t.set("on_submit",([s])=>t.get("on")(["submit",s])),t.set("on_keydown",([s])=>t.get("on")(["keydown",s])),t.set("state",([s,o])=>(s&&(l._state[s]=o??""),null));let i=t.get("set");t.set("set",([s,o])=>(s&&(l._state[s]=o??""),i([s,o],n))),t.set("text",([s])=>{if(!s)return"";let o=l._state;return s.replace(/\x01/g,"").replace(/\$([a-zA-Z_][a-zA-Z0-9_-]*)/g,(a,c)=>c in o?String(o[c]):a).replace(/\x02/g,"$")}),t.set("style",([s])=>{if(s){let o=a=>n.evaluate(a).join("");r.styles.push(k(s,o))}return null}),t.set("page",()=>null),t.set("route",()=>null),t.set("title",()=>null)}function Z(l){let t=l._webCtx||{styles:[]},r=l._state||{},n=t.styles.join(`
`),i=l._output||"",s=C+`
`+n;if(Object.keys(r).length>0&&l._source){let o=I(l._source),a=L(o);return`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${C+`
`+a.css}</style>
</head>
<body>
  <div id="app"></div>
  <script>${a.js}<\/script>
</body>
</html>`}return`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${s}</style>
</head>
<body>
  <div id="app">${i}</div>
</body>
</html>`}var ht=$.Parser.lex;function B(l=!1){let t=new $;return l&&R(t),t}function dt(l,t=B()){return t.run(l)}function mt(l,t){let r=B(!0);return t&&(r._baseDir=t),r._source=l,r._output=r.run(l),Z(r)}function gt(l){let t=B(!0);return l.replace(/<script\s+type="text\/khem"[^>]*>([\s\S]*?)<\/script>/gi,(r,n)=>{try{return t.run(n.trim())}catch(i){return console.error("Khem script error:",i),`<!-- Error: ${i.message} -->`}})}export{$ as Khem,B as createEnvironment,Z as generateHTML,R as loadWebLib,ht as parse,gt as processScriptTags,mt as renderForWeb,dt as run};

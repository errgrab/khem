export const DEFAULT_CSS = `:root {
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
  background: #0e1a10;
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
`;

export const GOOGLE_FONTS =
  "https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Instrument+Serif:ital@0;1&display=swap";

import fs from 'fs';
import { run } from '../src/index.js';

const code = `
  set title "Khem Node Test"
  puts "Running $title from the backend!"
`;

run(code);

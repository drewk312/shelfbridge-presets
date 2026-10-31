import { readFileSync, writeFileSync } from 'node:fs';
let s = readFileSync('sources.mjs', 'utf8');
const anchor = "description: 'Royal Road public chapters. Provider ID assumed; unlocked chapters only; access terms still under review.', compatNote: 'Direct chapter pages. Public chapters only.' }";
if (!s.includes(anchor)) throw new Error('anchor missing');
s = s.replace(anchor, anchor + ',');
writeFileSync('sources.mjs', s);
console.log('patched');
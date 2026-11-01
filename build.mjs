import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { PRESETS, PROVIDERS } from './sources.mjs';
import { makePreset } from './lib/preset.mjs';

const RAW_BASE = 'https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/';
const check = process.argv.includes('--check');
let stale = 0;

const ids = new Set();
for (const spec of PRESETS) {
  if (ids.has(spec.id)) throw new Error('Duplicate preset id ' + spec.id);
  ids.add(spec.id);
  for (const s of spec.sources) if (!PROVIDERS[s]) throw new Error(`${spec.file}: unknown provider ${s}`);
}

const written = [];
for (const spec of PRESETS) {
  const json = JSON.stringify(makePreset(spec), null, 2) + '\n';
  const existing = existsSync(spec.file) ? readFileSync(spec.file, 'utf8') : null;
  if (existing !== json) {
    stale++;
    if (check) console.error('stale: ' + spec.file);
    else writeFileSync(spec.file, json);
  }
  written.push({ spec, bytes: Buffer.from(json) });
}

const catalog = {
  schemaVersion: '1.0.0',
  kind: 'shelfbridge-catalog',
  name: 'ShelfBridge',
  appImportable: false,
  generatedBy: 'build.mjs — do not hand-edit',
  instructions: 'Import an individual preset URL, not this catalog.',
  integrityNote: 'Checksums detect mismatched releases. They are not signatures.',
  presets: written.map(({ spec, bytes }) => ({
    id: spec.id,
    name: spec.name,
    file: spec.file,
    url: RAW_BASE + spec.file,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    status: spec.status,
    contentTypes: spec.contentTypes,
    downloadMethod: spec.downloadMethod,
    requiresDebrid: spec.downloadMethod !== 'direct',
    language: spec.language,
    languageMode: 'strict',
    providers: spec.sources,
    ...(spec.format ? { format: spec.format } : {}),
    verification: {
      checkedOn: new Date().toISOString().slice(0, 10),
      search: spec.status === 'candidate' ? 'unverified' : 'pending',
      download: 'unverified',
      continuousMonitoring: false
    },
    compatibility: Object.fromEntries(
      ['lantern-and-leaf', 'ink-and-echo', 'bokumi', 'manga-comics-app'].map(a => [a, { status: 'not-tested' }])
    )
  }))
};

const catJson = JSON.stringify(catalog, null, 2) + '\n';
const catStale = existsSync('catalog.json') ? readFileSync('catalog.json', 'utf8') !== catJson : true;
if (catStale) {
  stale++;
  if (check) console.error('stale: catalog.json');
  else writeFileSync('catalog.json', catJson);
}

if (check && stale) {
  console.error(`\n${stale} file(s) out of date. Run: node build.mjs`);
  process.exit(1);
}
if (!check) console.log(`Wrote ${written.length} presets + catalog.json`);

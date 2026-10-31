import { readFileSync, writeFileSync } from 'node:fs';

let s = readFileSync('sources.mjs', 'utf8');
const must = (from, to) => {
  if (!s.includes(from)) throw new Error('anchor missing: ' + from.slice(0, 50));
  s = s.replace(from, to);
};

// backend canonical id
must('  audiobookbay: {', '  abb: {');
s = s.split("'audiobookbay'").join("'abb'");

// sources the backend actually exposes but we never listed
must(
  "  royalroad: { label: 'Royal Road', media: 'webnovel', method: 'direct', rpm: 6, rowSource: 'royalroad', hosts: ['royalroad.com'], pathPattern: null, fileType: null },",
  `  royalroad: { label: 'Royal Road', media: 'webnovel', method: 'direct', rpm: 6, rowSource: 'royalroad', hosts: ['royalroad.com'], pathPattern: null, fileType: null },
  openlib: { label: 'OpenLibrary', media: 'ebook', method: 'direct', rpm: 8, rowSource: 'openlib', hosts: null, pathPattern: null, fileType: null },
  dbooks: { label: 'DBooks', media: 'ebook', method: 'direct', rpm: 8, rowSource: 'dbooks', hosts: null, pathPattern: null, fileType: null },
  libgen: { label: 'LibGen', media: 'ebook', method: 'direct', rpm: 6, rowSource: 'libgen', hosts: null, pathPattern: null, fileType: null },
  libgenfiction: { label: 'LibGen Fiction', media: 'ebook', method: 'direct', rpm: 6, rowSource: 'libgenfiction', hosts: null, pathPattern: null, fileType: null },
  manybooks: { label: 'ManyBooks', media: 'ebook', method: 'direct', rpm: 8, rowSource: 'manybooks', hosts: null, pathPattern: null, fileType: null },
  feedbooks: { label: 'Feedbooks', media: 'ebook', method: 'direct', rpm: 8, rowSource: 'feedbooks', hosts: null, pathPattern: null, fileType: null },
  pdfdrive: { label: 'PDFDrive', media: 'ebook', method: 'direct', rpm: 6, rowSource: 'pdfdrive', hosts: null, pathPattern: null, fileType: null },
  archiveorg: { label: 'Internet Archive', media: 'all', method: 'direct', rpm: 6, rowSource: 'archiveorg', hosts: ['archive.org'], pathPattern: null, fileType: null },
  tokyobook: { label: 'Tokybook', media: 'audiobook', method: 'direct', rpm: 8, rowSource: 'tokyobook', hosts: null, pathPattern: null, fileType: null },
  loyalbooks: { label: 'Loyal Books', media: 'audiobook', method: 'direct', rpm: 8, rowSource: 'loyalbooks', hosts: null, pathPattern: null, fileType: null },
  goldenaudiobooks: { label: 'Golden Audiobooks', media: 'audiobook', method: 'direct', rpm: 8, rowSource: 'goldenaudiobooks', hosts: null, pathPattern: null, fileType: null },
  bookaudiobooks: { label: 'BookAudiobooks', media: 'audiobook', method: 'direct', rpm: 8, rowSource: 'bookaudiobooks', hosts: null, pathPattern: null, fileType: null },
  audiobooks4soul: { label: 'Audiobooks4Soul', media: 'audiobook', method: 'direct', rpm: 8, rowSource: 'audiobooks4soul', hosts: null, pathPattern: null, fileType: null },
  fulllengthaudiobooks: { label: 'FullLengthAudiobooks', media: 'audiobook', method: 'direct', rpm: 8, rowSource: 'fulllengthaudiobooks', hosts: null, pathPattern: null, fileType: null },`
);

const extra = [
  ['ebooks-openlib.json', 'shelfbridge-ebooks-openlib-v1', 'ShelfBridge — OpenLibrary', 'ebook', 'openlib', 'OpenLibrary catalogue. Borrowable and public-domain records.'],
  ['ebooks-dbooks.json', 'shelfbridge-ebooks-dbooks-v1', 'ShelfBridge — DBooks', 'ebook', 'dbooks', 'DBooks direct file host, no account.'],
  ['ebooks-libgen.json', 'shelfbridge-ebooks-libgenalt-v1', 'ShelfBridge — LibGen (alt mirror)', 'ebook', 'libgen', 'LibGen alternate mirror, separate from libgenli.'],
  ['ebooks-libgenfiction.json', 'shelfbridge-ebooks-libgenfiction-v1', 'ShelfBridge — LibGen Fiction', 'ebook', 'libgenfiction', 'LibGen fiction index, strong on trade and genre novels.'],
  ['ebooks-manybooks.json', 'shelfbridge-ebooks-manybooks-v1', 'ShelfBridge — ManyBooks', 'ebook', 'manybooks', 'ManyBooks public-domain catalogue.'],
  ['ebooks-feedbooks.json', 'shelfbridge-ebooks-feedbooks-v1', 'ShelfBridge — Feedbooks', 'ebook', 'feedbooks', 'Feedbooks public-domain catalogue.'],
  ['ebooks-pdfdrive.json', 'shelfbridge-ebooks-pdfdrive-v1', 'ShelfBridge — PDFDrive', 'ebook', 'pdfdrive', 'PDFDrive large PDF-only library.'],
  ['ebooks-archiveorg.json', 'shelfbridge-ebooks-archiveorg-v1', 'ShelfBridge — Internet Archive', 'ebook', 'archiveorg', 'Internet Archive texts. Direct files, no account.'],
  ['audiobooks-loyalbooks.json', 'shelfbridge-audiobooks-loyalbooks-v1', 'ShelfBridge — Loyal Books', 'audiobook', 'loyalbooks', 'Loyal Books public-domain audiobooks.'],
  ['audiobooks-tokyobook.json', 'shelfbridge-audiobooks-tokyobook-v1', 'ShelfBridge — Tokybook', 'audiobook', 'tokyobook', 'Tokybook audiobook host.'],
  ['audiobooks-golden.json', 'shelfbridge-audiobooks-golden-v1', 'ShelfBridge — Golden Audiobooks', 'audiobook', 'goldenaudiobooks', 'Golden Audiobooks direct host.'],
  ['audiobooks-bookaudiobooks.json', 'shelfbridge-audiobooks-bookaudiobooks-v1', 'ShelfBridge — BookAudiobooks', 'audiobook', 'bookaudiobooks', 'BookAudiobooks direct host.'],
  ['audiobooks-4soul.json', 'shelfbridge-audiobooks-4soul-v1', 'ShelfBridge — Audiobooks4Soul', 'audiobook', 'audiobooks4soul', 'Audiobooks4Soul direct host.'],
  ['audiobooks-fulllength.json', 'shelfbridge-audiobooks-fulllength-v1', 'ShelfBridge — FullLengthAudiobooks', 'audiobook', 'fulllengthaudiobooks', 'FullLengthAudiobooks direct host.']
];

const block = extra.map(([file, id, name, ct, src, desc]) =>
  `  { file: '${file}', id: '${id}', name: '${name}', version: V, language: 'en', contentType: '${ct}', contentTypes: ['${ct}'], downloadMethod: 'direct', sources: ['${src}'], limit: 40, threshold: 0.4, status: 'candidate', description: '${desc} Provider ID from the live backend; unproven until probed.', compatNote: 'Direct files only.' },`
).join('\n');

must('\n];\n', '\n' + block + '\n];\n');

writeFileSync('sources.mjs', s);
console.log('patched');
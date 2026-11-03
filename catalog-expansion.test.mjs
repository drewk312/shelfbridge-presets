import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PRESETS} from './sources.mjs';
import {makePreset} from './lib/preset.mjs';
import {exclusionsFor} from './mapping.mjs';

for(const [format,allowed,excluded] of [
  ['epub','epub',['pdf','mobi','azw3']],
  ['mp3','mp3',['m4b','flac','opus']],
  ['flac','flac',['mp3','m4b','aac']]
]) test(format+' presets exclude conflicting formats',()=>{
  const terms=exclusionsFor(format==='epub'?'ebook':'audiobook',format);
  assert.ok(!terms.includes(allowed));
  for(const other of excluded)assert.ok(terms.includes(other),'must exclude '+other);
});

for(const file of ['ebooks-epub.json','public-domain-all.json','public-domain-ebooks-any.json',
  'ebooks-knaben.json','audiobooks-knaben.json','comics-knaben.json']) {
  test(file+' has a complete dual-app source definition',()=>{
    const spec=PRESETS.find(p=>p.file===file);
    assert.ok(spec,'preset definition missing');
    const p=makePreset(spec);
    assert.equal(p.kind,'search');
    assert.deepEqual(p.search,p.adapters.source);
    assert.deepEqual(p.search,p.adapters.search);
    assert.equal(p.search.response.resultsPath,'results');
    assert.equal(p.search.request.body.title,'{TITLE}');
    assert.equal(p.search.request.body.author,'{AUTHOR}');
    assert.ok(p.search.response.mapping.ebookUrl);
    assert.ok(p.search.response.mapping.audioUrl);
    assert.ok(p.search.response.mapping.archiveUrl);
    assert.ok(p.search.response.mapping.magnet);
  });
}

test('README lists every preset with its importable raw JSON URL',()=>{
  const readme=readFileSync(new URL('./README.md',import.meta.url),'utf8');
  for(const spec of PRESETS){
    assert.ok(readme.includes('['+spec.file+'](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/'+spec.file+')'),'missing '+spec.file);
  }
  assert.match(readme,/Lantern & Leaf/);
  assert.match(readme,/Ink & Echo/);
});

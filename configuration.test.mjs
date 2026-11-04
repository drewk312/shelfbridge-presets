import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS } from './sources.mjs';
import { makePreset } from './lib/preset.mjs';
import { PRESET_REGISTRY, applyPresetToUrl } from './preset-registry.mjs';
const spec = file => PRESETS.find(p => p.file === file);

for (const [file, lang, mode] of [
  ['ebooks-any.json','any','any'],
  ['audiobooks-any.json','any','any'],
  ['manga.json','any','any'],
  ['ebooks-ro.json','ro','strict']
]) {
  test(file + ' publishes its effective language policy consistently', () => {
    const p = makePreset(spec(file)), u = new URL(p.search.request.url);
    assert.equal(u.searchParams.get('lang'), lang);
    assert.equal(u.searchParams.get('languageMode'), mode);
    assert.equal(p.meta.language, lang);
    assert.equal(p.meta.languageMode, mode);
  });
}
test('manga routing never adds an undeclared provider', () => {
  assert.equal(PRESET_REGISTRY.manga.sources, 'nyaa,knaben');
});
test('format targets survive server preset expansion', () => {
  const r = applyPresetToUrl(new URL('https://example.test/search?preset=ebooks-pdf'), {});
  assert.equal(r.url.searchParams.get('format'), 'pdf');
  assert.equal(r.body.format, 'pdf');
});
test('server expansion preserves a requested audiobook within a mixed preset', () => {
  const r = applyPresetToUrl(new URL('https://example.test/search?preset=all'), {contentType:'audiobook'});
  assert.equal(r.body.contentType, 'audiobook');
});
test('fast preset metadata reflects its actual profile', () => {
  assert.equal(makePreset(spec('fast-ebooks.json')).meta.coverageProfile, 'fast');
});
test('unverified downloads are never marked verified by preset overrides', () => {
  assert.notEqual(makePreset(spec('mobilism.json')).meta.downloadVerified, true);
});

test('the main bundle includes Z-Library without stale server preset overrides',()=>{
  const p=makePreset(spec('all.json'));
  const url=new URL(p.search.request.url);
  assert.ok(url.searchParams.get('sources').split(',').includes('zlib'));
  assert.equal(url.searchParams.get('preset'),null);
  assert.equal(p.search.request.body.preset,undefined);
});
test('unavailable Tokybook preset is removed',()=>{assert.equal(spec('audiobooks-tokyobook.json'),undefined);});

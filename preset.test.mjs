import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PRESETS, PROVIDERS } from './sources.mjs';
import { ALLOWED_MAPPINGS } from './mapping.mjs';

for (const spec of PRESETS) {
  test(spec.file + ' is contract-clean and self-consistent', () => {
    const text = readFileSync(new URL(spec.file, import.meta.url), 'utf8');
    const p = JSON.parse(text);
    assert.equal(p.id, spec.id);
    assert.equal(p.version, spec.version);
    assert.equal(p.kind, 'search');
    assert.equal(p.schemaVersion, '1.0.0');
    assert.ok(p.lawfulNote, 'lawfulNote required on every preset');
    assert.ok(p.contentTypes.includes(p.contentType) || p.contentType === 'all');
    assert.equal(p.debrid, p.downloadService);
    assert.deepEqual(p.debridServices, [p.downloadService]);
    assert.equal(p.hostedProviderUrl, 'https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/' + spec.file);

    // the triple must be identical, not merely similar
    assert.deepEqual(p.search, p.adapters.source);
    assert.deepEqual(p.search, p.adapters.search);
    assert.deepEqual(p.meta.sources, spec.sources);

    const url = new URL(p.search.request.url);
    assert.equal(url.origin, 'https://search.inkecho.duckdns.org');
    assert.equal(url.pathname, '/public/all/search');
    assert.equal(url.searchParams.get('debrid'), p.downloadService);
    assert.equal(url.searchParams.get('lang'), 'en');
    assert.equal(url.searchParams.get('languageMode'), 'strict');
    assert.equal(url.searchParams.get('sources'), spec.sources.join(','));
    assert.equal(url.searchParams.get('cacheBust'), `${p.id}-v${p.version}`, 'cacheBust must track version');
    assert.ok(p.search.request.timeout > 0 && p.search.request.timeout <= 30000);

    for (const k of Object.keys(p.search.response.mapping)) assert.ok(ALLOWED_MAPPINGS.has(k), 'unsupported mapping ' + k);
    for (const k of ['title', 'author', 'downloadService', 'fileFormat', 'sourcePageUrl']) {
      assert.ok(p.search.response.mapping[k], 'missing mapping ' + k);
    }

    // content-type exclusion correctness
    const ex = new Set(p.excludeTerms);
    assert.ok(ex.has('x264'), 'video terms always excluded');
    if (p.contentType === 'ebook') {
      for (const t of ['mp3', 'm4b', 'flac']) assert.ok(ex.has(t), 'ebook must exclude ' + t);
      assert.ok(!ex.has('epub'), 'ebook must not exclude epub');
    }
    if (p.contentType === 'audiobook') {
      for (const t of ['epub', 'pdf', 'mobi']) assert.ok(ex.has(t), 'audiobook must exclude ' + t);
    }

    assert.doesNotMatch(text, /pages\.dev|PRIVATE KEY|Bearer\s|api[_-]?key/i);
  });
}

test('every provider in every preset is registered with a sane rate limit', () => {
  for (const spec of PRESETS) {
    for (const s of spec.sources) assert.ok(PROVIDERS[s], 'unregistered provider ' + s);
    assert.ok(spec.rpm > 0 && spec.rpm <= 60);
  }
});

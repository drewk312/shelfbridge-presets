import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PRESETS, PROVIDERS } from './sources.mjs';
import { ALLOWED_MAPPINGS, LANGUAGE_LABELS } from './mapping.mjs';
import { rpmFor } from './lib/preset.mjs';

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
    assert.equal(p.meta.language, spec.language);
    assert.ok(LANGUAGE_LABELS[spec.language], 'unregistered language');
    assert.equal(p.hostedProviderUrl, 'https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/' + spec.file);

    // the triple must be identical, not merely similar
    assert.deepEqual(p.search, p.adapters.source);
    assert.deepEqual(p.search, p.adapters.search);
    assert.deepEqual(p.meta.sources, spec.sources);

    const url = new URL(p.search.request.url);
    assert.equal(url.origin, 'https://search.inkecho.duckdns.org');
    assert.equal(url.pathname, '/public/all/search');
    assert.equal(url.searchParams.get('debrid'), p.downloadService);
    assert.equal(url.searchParams.get('lang'), spec.language);
    assert.equal(url.searchParams.get('languageMode'), 'strict');
    assert.equal(url.searchParams.get('sources'), spec.sources.join(','));
    assert.equal(url.searchParams.get('cacheBust'), `${p.id}-v${p.version}`, 'cacheBust must track version');
    assert.ok(p.search.request.timeout > 0 && p.search.request.timeout <= 30000);

    // rate limit must be the slowest member, never hand-set
    assert.equal(p.rateLimit.requestsPerMinute, rpmFor(spec));
    assert.equal(p.matching.threshold, spec.threshold);

    for (const k of Object.keys(p.search.response.mapping)) assert.ok(ALLOWED_MAPPINGS.has(k), 'unsupported mapping ' + k);
    for (const k of ['title', 'author', 'downloadService', 'fileFormat', 'sourcePageUrl']) {
      assert.ok(p.search.response.mapping[k], 'missing mapping ' + k);
    }

    const ex = new Set(p.excludeTerms);
    for (const t of ['x264', 'sample', 'preview', 'excerpt']) assert.ok(ex.has(t), 'junk/video term dropped: ' + t);
    if (p.contentType === 'ebook') {
      for (const t of ['mp3', 'm4b', 'flac']) assert.ok(ex.has(t), 'ebook must exclude ' + t);
      if (!spec.format) assert.ok(!ex.has('epub'), 'unformatted ebook must not exclude epub');
    }
    if (p.contentType === 'audiobook') {
      for (const t of ['epub', 'pdf', 'mobi']) assert.ok(ex.has(t), 'audiobook must exclude ' + t);
    }
    if (spec.format === 'kindle') {
      for (const t of ['epub', 'pdf', 'djvu']) assert.ok(ex.has(t), 'kindle must exclude ' + t);
      for (const t of ['mobi', 'azw', 'azw3']) assert.ok(!ex.has(t), 'kindle must allow ' + t);
    }
    if (spec.format === 'pdf') {
      assert.ok(ex.has('epub') && !ex.has('pdf'), 'pdf filter wrong');
    }
    if (spec.format === 'm4b') {
      for (const t of ['mp3', 'flac']) assert.ok(ex.has(t), 'm4b must exclude ' + t);
      assert.ok(!ex.has('m4b'), 'm4b must be allowed');
    }

    assert.doesNotMatch(text, /pages\.dev|PRIVATE KEY|Bearer\s|api[_-]?key/i);
  });
}

test('every provider is registered with a sane rate limit', () => {
  for (const spec of PRESETS) for (const s of spec.sources) assert.ok(PROVIDERS[s], 'unregistered provider ' + s);
  for (const [id, p] of Object.entries(PROVIDERS)) assert.ok(p.rpm > 0 && p.rpm <= 60, 'bad rpm on ' + id);
});

test('language codes used by presets all have an accepted-label pattern', () => {
  for (const spec of PRESETS) assert.ok(LANGUAGE_LABELS[spec.language], 'missing labels for ' + spec.language);
});

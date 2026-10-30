import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

test('catalog pins exact bytes and never overclaims verification', () => {
  const catalog = JSON.parse(readFileSync(new URL('./catalog.json', import.meta.url)));
  assert.equal(catalog.kind, 'shelfbridge-catalog');
  assert.equal(catalog.appImportable, false);
  assert.ok(catalog.presets.length > 0);

  const ids = new Set();
  for (const entry of catalog.presets) {
    assert.ok(!ids.has(entry.id), 'duplicate id');
    ids.add(entry.id);
    assert.match(entry.file, /^[a-z0-9-]+\.json$/);
    assert.ok(entry.language, 'catalog entry must record language');
    const bytes = readFileSync(new URL(entry.file, import.meta.url));
    assert.equal(entry.sha256, createHash('sha256').update(bytes).digest('hex'), 'stale bytes for ' + entry.file);
    const preset = JSON.parse(bytes);
    assert.equal(entry.id, preset.id);
    assert.equal(entry.url, preset.hostedProviderUrl);
    assert.equal(entry.language, preset.meta.language);
    assert.ok(['pilot', 'stable', 'candidate'].includes(entry.status));

    for (const app of ['lantern-and-leaf', 'ink-and-echo', 'bokumi', 'manga-comics-app']) {
      const v = entry.compatibility[app];
      assert.ok(v && ['not-tested', 'passed', 'failed'].includes(v.status));
      if (entry.status === 'stable') {
        assert.equal(v.status, 'passed');
        assert.ok(v.appVersion && v.evidence);
      }
    }
    if (entry.status === 'candidate') {
      assert.equal(entry.verification.search, 'unverified');
      assert.equal(entry.verification.download, 'unverified');
    }
    if (entry.status === 'pilot') assert.notEqual(entry.verification.search, 'failed');
  }
});

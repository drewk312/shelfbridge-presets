import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

test('catalog identifies the exact published preset without claiming untested app support',()=>{
 const path=new URL('./catalog.json',import.meta.url);
 assert.ok(existsSync(path),'Catalog must exist');
 const catalog=JSON.parse(readFileSync(path));
 assert.equal(catalog.kind,'shelfbridge-catalog');
 assert.equal(catalog.appImportable,false);
 assert.ok(catalog.presets.length>0);
 const ids=new Set();
 for(const entry of catalog.presets){
  assert.ok(!ids.has(entry.id),'Duplicate preset ID');ids.add(entry.id);
  assert.match(entry.file,/^[a-z0-9-]+\.json$/);
  const bytes=readFileSync(new URL(entry.file,import.meta.url));
  const preset=JSON.parse(bytes);
  assert.equal(entry.sha256,createHash('sha256').update(bytes).digest('hex'),'Catalog has stale preset bytes');
  assert.equal(entry.id,preset.id);assert.equal(entry.version,preset.version);
  assert.equal(entry.url,preset.hostedProviderUrl);
  assert.equal(entry.downloadMethod,preset.downloadService);
  assert.equal(entry.language,new URL(preset.search.request.url).searchParams.get('lang'));
  assert.equal(entry.languageMode,new URL(preset.search.request.url).searchParams.get('languageMode'));
  assert.ok(['pilot','stable'].includes(entry.status));
  for(const app of ['lantern-and-leaf','ink-and-echo','bokumi','manga-comics-app']){
   const verification=entry.compatibility[app];assert.ok(verification);
   assert.ok(['not-tested','passed','failed'].includes(verification.status));
   if(entry.status==='stable'){
    assert.equal(verification.status,'passed');
    assert.ok(verification.appVersion&&verification.evidence);
   }
  }
 }
});

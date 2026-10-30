import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
const path=new URL('./direct-ebooks.json',import.meta.url);
test('pilot uses only supported mappings and direct HTTPS routing',()=>{
 assert.ok(existsSync(path),'Release preset must exist');
 const text=readFileSync(path,'utf8'),p=JSON.parse(text);
 assert.equal(p.name,'ShelfBridge — Direct Ebooks');
 assert.match(p.description,/pilot/i);
 assert.equal(p.hostedProviderUrl,'https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/direct-ebooks.json');
 assert.equal(p.meta.hostedProviderUrl,p.hostedProviderUrl);
 for(const k of ['debrid','debridChoice','selectedDebridService','downloadService'])assert.equal(p[k],'direct');
 assert.deepEqual(p.debridServices,['direct']);
 const allowed=new Set('title author narrator cover synopsis tags durationMinutes pages audioUrl ebookUrl archiveUrl magnet magnetUrl infoHash downloadService fileFormat sourcePageUrl isbn'.split(' '));
 for(const a of [p.search,p.adapters.source,p.adapters.search]){
  assert.ok(!a.cacheNotifyUrl);
  const u=new URL(a.request.url);
  assert.equal(u.origin,'https://search.inkecho.duckdns.org');
  assert.equal(u.searchParams.get('debrid'),'direct');
  assert.equal(u.searchParams.get('lang'),'en');
  assert.equal(u.searchParams.get('languageMode'),'strict');
  assert.ok(a.request.timeout>0&&a.request.timeout<=30000);
  assert.equal(a.response.mapping.downloadService,'downloadService');
  assert.equal(a.response.mapping.ebookUrl,'ebookUrl');
  for(const key of Object.keys(a.response.mapping))assert.ok(allowed.has(key),'Unsupported mapping: '+key);
 }
 assert.doesNotMatch(text,/inkandecho-builder\.pages\.dev|PRIVATE KEY|Bearer\s|api[_-]?key|token=/i);
});

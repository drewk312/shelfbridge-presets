import test from 'node:test';
import assert from 'node:assert/strict';
import {PRESETS,PROVIDERS} from './sources.mjs';
import {makePreset} from './lib/preset.mjs';
for(const file of ['audiobooks.json','audiobooks-any.json','audiobooks-ro.json','audiobooks-ar.json'])test(file+' sends only torrent providers and preserves magnet metadata',()=>{
 const spec=PRESETS.find(s=>s.file===file);const p=makePreset(spec);
 for(const id of spec.sources)assert.equal(PROVIDERS[id].method,'torbox');
 const request=new URL(p.search.request.url);
 assert.equal(request.searchParams.get('sources'),'audiobookbay,knaben');
 assert.equal(request.searchParams.get('preset'),null);
 assert.equal(p.search.response.mapping.magnet,'magnetUrl');
 assert.equal(p.search.response.mapping.infoHash,'infoHash');
 assert.equal(p.search.response.mapping.seedersKnown,'seedersKnown');
});

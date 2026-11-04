import test from 'node:test';
import assert from 'node:assert/strict';
import {PRESETS} from './sources.mjs';
import {makePreset} from './lib/preset.mjs';
for(const [file,source] of [['ebooks-torrentcsv.json','torrentcsv'],['ebooks-nyaa.json','nyaa']]) test(file+' requires EPUBs and explicit torrent routing',()=>{
 const spec=PRESETS.find(s=>s.file===file); assert.ok(spec);
 const p=makePreset(spec),u=new URL(p.search.request.url);
 assert.equal(u.searchParams.get('sources'),source);
 assert.equal(u.searchParams.get('format'),'epub');
 assert.equal(u.searchParams.get('preset'),null);
 assert.equal(p.contentType,'ebook');
 assert.equal(u.searchParams.get('media'),'ebook');
 assert.equal(p.search.response.mapping.magnet,'magnetUrl');
 assert.equal(p.search.response.mapping.infoHash,'infoHash');
});

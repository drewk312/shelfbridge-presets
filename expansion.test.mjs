import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
for(const [file,type,sources] of [['public-domain-ebooks.json','ebook','standardebooks,gutenberg'],['librivox-audiobooks.json','audiobook','librivox']]){
 test(file+' selects only intended providers and exposes the right download type',()=>{
  const path=new URL(file,import.meta.url);assert.ok(existsSync(path),'Missing new preset');
  const p=JSON.parse(readFileSync(path));assert.equal(p.contentType,type);assert.equal(p.downloadService,'direct');
  for(const a of [p.search,p.adapters.source,p.adapters.search]){
   const u=new URL(a.request.url);assert.equal(u.searchParams.get('sources'),sources);
   assert.equal(u.searchParams.get('languageMode'),'strict');assert.equal(u.searchParams.get('lang'),'en');
   assert.equal(a.request.body.contentType,type);
   assert.equal(a.response.mapping.downloadService,'downloadService');
   if(type==='audiobook'){assert.equal(a.response.mapping.archiveUrl,'url');assert.ok(!a.response.mapping.audioUrl);assert.ok(!a.response.mapping.ebookUrl);}
   else assert.equal(a.response.mapping.ebookUrl,'ebookUrl');
  }
 });
}

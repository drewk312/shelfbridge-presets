import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewedUrl} from './lib/download-check.mjs';
test('reviews exact hosted MD5 file routes for supported providers',()=>{
 for(const source of ['annas','zlib','libgenli']) assert.equal(reviewedUrl('https://search.inkecho.duckdns.org/dl/md5/58353a826a5fd2bec2c4473af57bacf9.pdf',source,{filePath:true}).hostname,'search.inkecho.duckdns.org');
});
test('does not trust arbitrary hosted paths',()=>{
 assert.throws(()=>reviewedUrl('https://search.inkecho.duckdns.org/admin','annas',{filePath:true}));
});

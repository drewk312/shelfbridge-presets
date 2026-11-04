import test from 'node:test';
import assert from 'node:assert/strict';
import {searchMagazines} from './server/magazines.mjs';
test('returns hosted PDF URLs only for resolved magazine files',async()=>{
 const fetchImpl=async url=>new Response(url.includes('?s=')?'<h2><a href="https://freemagazines.top/science-issue">Science Issue</a></h2>':'<a href="https://easyupload.us/ABC123/preview">PDF</a>');
 const rows=await searchMagazines('Science',{fetchImpl});
 assert.equal(rows[0].url,'https://search.inkecho.duckdns.org/dl/magazine/ABC123.pdf');
 assert.equal(rows[0].fileType,'pdf');
});
import {fetchMagazine} from './server/magazines.mjs';
test('rejects non-PDF responses instead of returning error pages',async()=>{
 await assert.rejects(fetchMagazine('ABC123',{fetchImpl:async url=>new Response(url.includes('/preview')?'<a href="/secure/file-range/FILE123">read</a>':'<html>error</html>')}),/Invalid PDF/);
});
test('rejects IDs that can change the destination path',async()=>{
 await assert.rejects(fetchMagazine('../admin'),/Invalid magazine ID/);
});
test('replays verified PDF bytes without dropping the first chunk',async()=>{
 const result=await fetchMagazine('ABC123',{fetchImpl:async url=>new Response(url.includes('/preview')?'<a href="/secure/file-range/FILE123">read</a>':'%PDF-1.6\nfixture')});
 assert.equal(await result.text(),'%PDF-1.6\nfixture');
});
test('accepts a PDF signature split across network chunks',async()=>{
 const result=await fetchMagazine('ABC123',{fetchImpl:async url=>url.includes('/preview')?new Response('<a href="/secure/file-range/FILE123">read</a>'):new Response(new ReadableStream({start(c){c.enqueue(Buffer.from('%P'));c.enqueue(Buffer.from('DF-1.7\nfile'));c.close();}}))});
 assert.equal(await result.text(),'%PDF-1.7\nfile');
});

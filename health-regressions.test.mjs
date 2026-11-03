import test from 'node:test';
import assert from 'node:assert/strict';
import {validateProbe,verifyDownload,runHealth} from './health.mjs';

const row={source:'standardebooks',language:'English',downloadService:'direct',fileType:'epub',ebookUrl:'https://standardebooks.org/ebooks/a/b/downloads/c.epub'};
test('a provider probe cannot pass without provider attribution',()=>{
  assert.throws(()=>validateProbe({results:[{...row,source:undefined}]},'standardebooks'));
});
test('a typed provider cannot pass a result missing file type',()=>{
  assert.throws(()=>validateProbe({results:[{...row,fileType:undefined}]},'standardebooks'));
});
test('magnets require a valid torrent identity',async(t)=>{
  await assert.rejects(verifyDownload('magnet:invalid'),/magnet|torrent/i);
});
test('headers without a file media type do not verify a download',async(t)=>{
  t.mock.method(globalThis,'fetch',async()=>new Response(null,{status:200}));
  await assert.rejects(verifyDownload(row.ebookUrl,{source:'standardebooks'}),/media type|file type/i);
});
test('JSON error documents are never accepted as book files',async(t)=>{
  t.mock.method(globalThis,'fetch',async()=>new Response(null,{status:200,headers:{'Content-Type':'application/json','Content-Length':'10000'}}));
  await assert.rejects(verifyDownload(row.ebookUrl,{source:'standardebooks'}),/media type|file type/i);
});
test('redirects are reviewed before contacting their destination',async(t)=>{
  const calls=[];
  const fetchImpl=async url=>{calls.push(String(url));return new Response(null,{status:302,headers:{Location:'https://unreviewed.example.test/file.epub'}})};
  t.mock.method(globalThis,'fetch',fetchImpl);
  await assert.rejects(verifyDownload(row.ebookUrl,{source:'standardebooks',fetchImpl}),/host|destination/i);
  assert.equal(calls.length,1);
});
test('accepted HEAD evidence is explicitly headers-only',async(t)=>{
  t.mock.method(globalThis,'fetch',async()=>new Response(null,{status:200,headers:{'Content-Type':'application/epub+zip','Content-Length':'10000'}}));
  const result=await verifyDownload(row.ebookUrl,{source:'standardebooks',fetchImpl:async()=>new Response(null,{status:200,headers:{'Content-Type':'application/epub+zip','Content-Length':'10000'}})});
  assert.equal(result.evidence,'headers-only');
  assert.equal(result.transferVerified,false);
});
test('provider probes remove preset expansion and use backend source IDs',async(t)=>{
  const seen=[];
  t.mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify({results:[]}),{status:200}));
  const report=await runHealth({only:['gutenberg'],all:false,downloadCheck:false,paceMs:0,fetchImpl:async(url,options)=>{
    const u=new URL(url),body=JSON.parse(options.body);seen.push({u,body});
    return new Response(JSON.stringify({results:[{...row,source:'gutendex',ebookUrl:'https://www.gutenberg.org/ebooks/84.epub3.images'}]}),{status:200});
  }});
  assert.ok(seen.length>0);
  for(const {u,body} of seen){
    assert.equal(u.searchParams.get('preset'),null);
    assert.equal(u.searchParams.get('sources'),'gutendex');
    assert.equal(body.preset,undefined);
  }
  assert.equal(report.probed,seen.length);
  assert.equal(report.checks.find(check=>check.format===null).status,'passed');
  assert.ok(report.checks.filter(check=>['pdf','kindle'].includes(check.format)).every(check=>check.status==='failed'));
  assert.equal(report.checks.find(check=>check.format==='epub').status,'passed');
});

test('format-specific probes reject a different file format',()=>{
  assert.throws(()=>validateProbe({results:[row]},'standardebooks','en',{media:'ebook',format:'pdf'}),/format/i);
  assert.throws(()=>validateProbe({results:[row]},'standardebooks','en',{media:'ebook',format:'kindle'}),/format/i);
});
test('media-specific probes reject contradictory media metadata',()=>{
  assert.throws(()=>validateProbe({results:[{...row,mediaType:'audiobook'}]},'standardebooks','en',{media:'ebook'}),/media/i);
});
test('Atmos probes require an explicit source-reported audio label',()=>{
  const audio={source:'abb',language:'English',downloadService:'torbox',fileType:'m4b',magnetUrl:'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567'};
  assert.throws(()=>validateProbe({results:[audio]},'abb','en',{media:'audiobook',format:'m4b',audioFormat:'dolby-atmos'}),/audio/i);
});

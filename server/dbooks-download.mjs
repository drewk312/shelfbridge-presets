// Stable public DBooks locator. Publisher download tokens are resolved afresh,
// never returned to clients or persisted as long-lived search URLs.
const allowed=value=>{try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&['dbooks.org','www.dbooks.org'].includes(url.hostname)?url:null;}catch{return null;}};
const failure=(message,status)=>new Response(message,{status,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
async function boundedJson(response,max=32768){const reader=response.body?.getReader();if(!reader)throw Error('No metadata');let bytes=0;const chunks=[];try{for(;;){const part=await reader.read();if(part.done)break;bytes+=part.value.length;if(bytes>max)throw Error('Metadata too large');chunks.push(part.value);}}finally{reader.cancel().catch(()=>{});}const joined=new Uint8Array(bytes);let offset=0;for(const part of chunks){joined.set(part,offset);offset+=part.length;}return JSON.parse(new TextDecoder().decode(joined));}
export async function fetchDbooksFile(id,{range='',method='GET',signal,timeoutMs=20000,maxBytes=250*1024*1024}={},fetchImpl=fetch){
 if(!/^[A-Za-z0-9]{1,32}$/.test(String(id)))return failure('Invalid book id',400);
 if(range&&!/^bytes=(?:\d+-\d*|-\d+)$/.test(range))return failure('Unsupported byte range',416);
 const tinyEnd=/^bytes=0-(\d+)$/.exec(range)?.[1];const tinyLength=tinyEnd!==undefined&&Number(tinyEnd)<7?Number(tinyEnd)+1:0;
 const controller=new AbortController();const abort=()=>controller.abort();if(signal?.aborted)controller.abort();else signal?.addEventListener('abort',abort,{once:true});
 let timer=setTimeout(abort,timeoutMs);let reader;let streaming=false;
 const cleanup=()=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);};
 try{
  const metadata=await fetchImpl('https://www.dbooks.org/api/book/'+encodeURIComponent(String(id).toLowerCase()),{headers:{Accept:'application/json'},redirect:'error',signal:controller.signal});
  if(metadata.status===404){metadata.body?.cancel().catch(()=>{});return failure('Book not found',404);}if(!metadata.ok)throw Error('Metadata unavailable');
  const book=await boundedJson(metadata);if(book.status!=='ok')return failure('Book not found',404);let target=allowed(book.download);if(!target)throw Error('Invalid publisher locator');
  const headers={Accept:'application/pdf, application/epub+zip, application/octet-stream;q=0.9','Accept-Encoding':'identity','User-Agent':'InkAndEcho-BookReader/1.0'};if(range)headers.Range=tinyLength?'bytes=0-127':range;else if(method==='HEAD')headers.Range='bytes=0-127';
  let upstream;for(let redirects=0;redirects<5;redirects++){
   upstream=await fetchImpl(target.href,{headers,redirect:'manual',signal:controller.signal});
   if([301,302,303,307,308].includes(upstream.status)){const next=allowed(new URL(upstream.headers.get('location')||'',target).href);upstream.body?.cancel().catch(()=>{});if(!next)throw Error('Unsupported redirect');target=next;upstream=null;continue;}break;
  }
  if(!upstream)throw Error('Redirect limit');if(upstream.status===416){upstream.body?.cancel().catch(()=>{});return failure('Range unavailable',416);}
  const requestedStart=/^bytes=(\d+)-/.exec(range||headers.Range||'')?.[1];const returnedRange=/^bytes (\d+)-(\d+)\/(?:\d+|\*)$/i.exec(upstream.headers.get('content-range')||'');const malformedTotal=/\/(\d+)$/.exec(upstream.headers.get('content-range')||'')?.[1];const fullFirstRange=upstream.status===206&&requestedStart==='0'&&!returnedRange&&Number(malformedTotal)>0&&Number(malformedTotal)===Number(upstream.headers.get('content-length'));if(upstream.status===206&&!fullFirstRange&&requestedStart!==undefined&&Number(returnedRange?.[1])!==Number(requestedStart)){upstream.body?.cancel().catch(()=>{});throw Error('Wrong byte range');}
  if(!upstream.ok||/text\/html|application\/(?:json|xhtml)/i.test(upstream.headers.get('content-type')||'')||Number(upstream.headers.get('content-length'))>maxBytes){upstream.body?.cancel().catch(()=>{});throw Error('Publisher did not return a book');}
  reader=upstream.body?.getReader();if(!reader)throw Error('Empty file');const chunks=[];let received=0;
  // Nonzero ranges do not begin at the PDF signature; their Content-Range and
  // MIME are checked, while the first range/full download verifies file magic.
  const atStart=!range||/^bytes=0-/.test(range);
  while(received<8){const part=await reader.read();if(part.done)break;received+=part.value.length;if(received>maxBytes)throw Error('File too large');chunks.push(part.value);}
  const prefix=new Uint8Array(Math.min(received,8));let offset=0;for(const chunk of chunks){const part=chunk.subarray(0,prefix.length-offset);prefix.set(part,offset);offset+=part.length;if(offset>=prefix.length)break;}
  const isPdf=new TextDecoder().decode(prefix).startsWith('%PDF-');const isEpub=prefix[0]===0x50&&prefix[1]===0x4b&&prefix[2]===3&&prefix[3]===4;
  if(atStart&&!isPdf&&!isEpub)throw Error('Invalid book signature');
  if(!atStart&&(upstream.status!==206||!/^bytes \d+-\d+\/(?:\d+|\*)$/i.test(upstream.headers.get('content-range')||'')||!/application\/(?:pdf|epub\+zip|octet-stream)/i.test(upstream.headers.get('content-type')||'')))throw Error('Invalid range response');
  clearTimeout(timer);const responseHeaders=new Headers({'Cache-Control':'no-store','Content-Type':isPdf?'application/pdf':isEpub?'application/epub+zip':upstream.headers.get('content-type'),'Content-Disposition':'attachment; filename="'+id+(isEpub?'.epub':'.pdf')+'"'});
  for(const name of['Content-Length','Content-Range','Accept-Ranges'])if(upstream.headers.has(name))responseHeaders.set(name,upstream.headers.get(name));
  if(fullFirstRange){responseHeaders.delete('Content-Range');responseHeaders.set('Accept-Ranges','none');}
  let outputRemaining=tinyLength||Infinity;const total=/\/(\d+)$/.exec(upstream.headers.get('content-range')||'')?.[1]||upstream.headers.get('content-length');if(tinyLength){if(!total||Number(total)<tinyLength)throw Error('Unknown file extent');responseHeaders.set('Content-Range','bytes 0-'+(tinyLength-1)+'/'+total);responseHeaders.set('Content-Length',String(tinyLength));responseHeaders.set('Accept-Ranges','bytes');}
  if(method==='HEAD'){reader.cancel().catch(()=>{});if(!range&&upstream.status===206){const total=/\/(\d+)$/.exec(upstream.headers.get('content-range')||'')?.[1];responseHeaders.delete('Content-Range');if(total)responseHeaders.set('Content-Length',total);}return new Response(null,{status:tinyLength?206:range&&!fullFirstRange?upstream.status:200,headers:responseHeaders});}
  streaming=true;const body=new ReadableStream({async pull(stream){try{if(chunks.length){const part=chunks.shift();const value=part.subarray(0,Math.min(part.length,outputRemaining));outputRemaining-=value.length;stream.enqueue(value);if(outputRemaining===0){controller.abort();reader.cancel().catch(()=>{});cleanup();stream.close();}return;}timer=setTimeout(abort,30000);const part=await reader.read();clearTimeout(timer);if(part.done){cleanup();stream.close();return;}received+=part.value.length;if(received>maxBytes)throw Error('File too large');stream.enqueue(part.value);}catch(error){controller.abort();reader.cancel().catch(()=>{});cleanup();stream.error(error);}},cancel(){controller.abort();reader.cancel().catch(()=>{});cleanup();}});
  return new Response(body,{status:tinyLength?206:fullFirstRange?200:upstream.status,headers:responseHeaders});
 }catch{controller.abort();reader?.cancel().catch(()=>{});return failure('DBooks file temporarily unavailable',502);}
 finally{if(!streaming)cleanup();}
}


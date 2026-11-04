const origin='https://search.inkecho.duckdns.org';
async function page(url,fetchImpl,signal){
 const r=await fetchImpl(url,{redirect:'error',signal,headers:{'User-Agent':'Mozilla/5.0'}});
 if(!r.ok)throw Error('Magazine upstream HTTP '+r.status);
 const reader=r.body.getReader();const parts=[];let size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>1500000)throw Error('Page too large');parts.push(Buffer.from(value));}}finally{await reader.cancel();}
 return Buffer.concat(parts).toString('utf8');
}
export async function searchMagazines(query,{fetchImpl=fetch,signal=AbortSignal.timeout(10000)}={}){
 const html=await page('https://freemagazines.top/?s='+encodeURIComponent(query),fetchImpl,signal);
 const entries=[...html.matchAll(/<h[23][^>]*>[\s\S]*?<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].slice(0,5);
 const results=await Promise.allSettled(entries.map(async m=>{
 const url=new URL(m[1]);if(url.origin!=='https://freemagazines.top')return null;
 const detail=await page(url.href,fetchImpl,signal);
 const link=[...detail.matchAll(/href=["'](https:\/\/easyupload\.us\/([A-Za-z0-9]+)\/preview)["']/g)][0];if(!link)return null;
 const target=origin+'/dl/magazine/'+link[2]+'.pdf';
 return {source:'freemagazines',title:m[2].replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').trim(),author:'',url:target,downloadUrl:target,ebookUrl:target,sourcePageUrl:url.href,format:'pdf',fileType:'pdf',mediaType:'ebook',language:'',accessType:'direct',downloadLocatorVerified:true};
 }));
 return results.filter(r=>r.status==='fulfilled'&&r.value).map(r=>r.value);
}
export async function fetchMagazine(id,{fetchImpl=fetch,signal=AbortSignal.timeout(30000)}={}){
 if(!/^[A-Za-z0-9]{4,40}$/.test(id))throw Error('Invalid magazine ID');
 const preview='https://easyupload.us/'+id+'/preview';const html=await page(preview,fetchImpl,signal);
 const matches=[...html.matchAll(/(?:href|src)=["']([^"']+)["']/g)];
 const target=matches.map(m=>{try{return new URL(m[1].replaceAll('&amp;','&'),preview)}catch{return null}}).find(u=>u&&u.origin==='https://easyupload.us'&&/^\/secure\/file-range\/[A-Za-z0-9]+$/.test(u.pathname));
 if(!target)throw Error('PDF unavailable');
 const r=await fetchImpl(target.href,{redirect:'error',signal,headers:{Referer:preview}});
 if(r.status!==200||!r.body) {await r.body?.cancel();throw Error('PDF unavailable');}
 const reader=r.body.getReader();let first;
 try{const chunks=[];let count=0;while(count<5){const part=await reader.read();if(part.done)break;chunks.push(Buffer.from(part.value));count+=part.value.length;}first={value:Buffer.concat(chunks)};if(first.value.subarray(0,5).toString()!=='%PDF-')throw Error('Invalid PDF');}catch(e){await reader.cancel();throw e;}
 let pending=first.value,total=0;
 const body=new ReadableStream({async pull(controller){try{const part=pending?{value:pending,done:false}:await reader.read();pending=null;if(part.done){controller.close();return;}total+=part.value.length;if(total>250*1024*1024)throw Error('PDF too large');controller.enqueue(part.value);}catch(e){await reader.cancel();controller.error(e);}},cancel(){return reader.cancel();}});
 const headers={'Content-Type':'application/pdf','Cache-Control':'no-store'}; const length=Number(r.headers.get('content-length')); if(Number.isSafeInteger(length)&&length>0&&!r.headers.get('content-encoding'))headers['Content-Length']=String(length); return new Response(body,{headers});
}

import {pathToFileURL} from 'node:url';
import {readFileSync} from 'node:fs';

const providers={
 standardebooks:{rowSource:'standardebooks',host:'standardebooks.org',file:'public-domain-ebooks.json'},
 gutenberg:{rowSource:'gutendex',host:'www.gutenberg.org',file:'public-domain-ebooks.json'},
 librivox:{rowSource:'librivox',host:'archive.org',file:'librivox-audiobooks.json'}
};
export function validateProbe(payload,source){
 const config=providers[source];
 if(!config)throw Error('Unknown probe provider');
 if(!Array.isArray(payload?.results)||payload.results.length===0)throw Error('No search results');
 for(const row of payload.results){
  if(row.source!==config.rowSource)throw Error('Unexpected source');
  if(!/^(en(?:-[a-z]+)?|english)$/i.test(row.language||''))throw Error('Unverified English language');
  if(row.downloadService!=='direct')throw Error('Wrong download method');
  const url=new URL(source==='librivox'?row.url:row.ebookUrl);
  if(url.protocol!=='https:'||url.hostname!==config.host||url.username||url.password||url.port)throw Error('Unreviewed file destination');
  const path=decodeURIComponent(url.pathname);
  if(source==='standardebooks'&&!/^\/ebooks\/.+\/downloads\/[^/]+\.epub$/.test(path))throw Error('Not an EPUB download path');
  if(source==='gutenberg'&&!/^\/ebooks\/\d+\.epub[\w.]*$/.test(path))throw Error('Not a Gutenberg EPUB path');
  if(source==='librivox'&&!/^\/(compress|download)\/.+\.zip$/i.test(path))throw Error('Not an audiobook archive path');
  if(source==='librivox'&&row.fileType!=='zip')throw Error('Expected audiobook archive');
  if(source!=='librivox'&&row.fileType!=='epub')throw Error('Expected EPUB metadata');
 }
 return payload.results.length;
}

// Read-only smoke checks. Never execute source code or update mirrors/presets.
export async function runHealth(){
 const report=[];
 for(const [source,config] of Object.entries(providers)){
  const start=Date.now();
  try{
   const preset=JSON.parse(readFileSync(new URL(config.file,import.meta.url)));
   const url=new URL(preset.search.request.url);
   if(url.origin!=='https://search.inkecho.duckdns.org'||url.pathname!=='/public/all/search')throw Error('Unexpected search endpoint');
   url.searchParams.set('sources',source);
   const response=await fetch(url,{method:'POST',redirect:'error',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:'Frankenstein',author:'Mary Shelley',contentType:source==='librivox'?'audiobook':'ebook',limit:5}),signal:AbortSignal.timeout(20000)});
   if(!response.ok){await response.body?.cancel();throw Error('HTTP '+response.status);}
   const reader=response.body.getReader();const chunks=[];let length=0;
   try{for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>2000000)throw Error('Oversized response');chunks.push(value);}}
   finally{await reader.cancel().catch(()=>{});}
   const count=validateProbe(JSON.parse(Buffer.concat(chunks).toString('utf8')),source);
   report.push({source,status:'passed',resultCount:count,elapsedMs:Date.now()-start});
  }catch(error){report.push({source,status:'failed',error:String(error.message).slice(0,200),elapsedMs:Date.now()-start});}
 }
 return {checkedAt:new Date().toISOString(),scope:'Search and result contract only; not a full download or native-app test',checks:report};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const report=await runHealth();console.log(JSON.stringify(report,null,2));
 if(report.checks.some(x=>x.status!=='passed'))process.exitCode=1;
}

import { pathToFileURL } from 'node:url';
import { PROVIDERS, PRESETS } from './sources.mjs';
import { LANGUAGE_LABELS } from './mapping.mjs';
import { makePreset } from './lib/preset.mjs';
import { backendSourceId, resolveConfiguration } from './lib/configuration.mjs';
import { ProbeError, reviewedUrl, validateMagnet, httpError, verifyDownload } from './lib/download-check.mjs';
export { verifyDownload } from './lib/download-check.mjs';

const sleep = ms => new Promise(resolve => setTimeout(resolve,ms));
const destination = row => row.ebookUrl || row.audioUrl || row.url || row.downloadUrl || row.magnetUrl || row.magnet;

export function validateProbe(payload, source, language='en', requirements={}) {
  const cfg = PROVIDERS[source];
  if (!cfg) throw new ProbeError('unsupported','Unknown provider');
  const pattern = LANGUAGE_LABELS[language];
  if (!pattern) throw new ProbeError('unsupported','Unknown probe language');
  if (!Array.isArray(payload?.results) || !payload.results.length) throw new ProbeError('empty','No search results for this canary');
  for (const row of payload.results) {
    const accepted = new Set([source,cfg.rowSource,backendSourceId(source)].filter(Boolean));
    if (!accepted.has(row.source)) throw new ProbeError('invalid-response','Missing or unexpected provider attribution');
    if (!new RegExp(pattern,'i').test(row.language || '')) throw new ProbeError('invalid-response','Unverified result language');
    if (row.downloadService !== cfg.method) throw new ProbeError('invalid-response','Wrong download method');
    const raw = destination(row);
    if (typeof raw !== 'string' || !raw) throw new ProbeError('invalid-response','No destination URL');
    if (raw.startsWith('magnet:')) {
      if (cfg.method !== 'torbox') throw new ProbeError('invalid-response','Magnet from a direct source');
      validateMagnet(raw);
    } else {
      // Search-contract validation is distinct from destination-policy/transfer evidence.
      reviewedUrl(raw,source,{requirePolicy:false,filePath:true});
    }

    const fileType=String(row.fileType || row.format || '').toLowerCase().replace(/^\./,'');
    if (requirements.format) {
      const formats=requirements.format==='kindle' ? ['mobi','azw','azw3'] : [requirements.format];
      if (!formats.includes(fileType)) throw new ProbeError('invalid-response','Result does not match requested format');
    }
    const normalizeMedia=value=>value==='magazine' ? 'ebook' : value==='comic' || value==='manga' ? 'comics' : value;
    const requestedMedia=normalizeMedia(requirements.media);
    const reportedMedia=normalizeMedia(row.mediaType || row.mediaKind);
    if (requestedMedia && requestedMedia!=='all' && reportedMedia && reportedMedia!==requestedMedia) {
      throw new ProbeError('invalid-response','Result has contradictory media metadata');
    }
    const audioTypes=['mp3','m4b','m4a','flac','ogg','aac','wav','opus','aax'];
    const ebookTypes=['epub','pdf','mobi','azw','azw3','djvu','fb2','txt','rtf','doc','docx'];
    if ((requestedMedia==='ebook' && audioTypes.includes(fileType)) ||
        (requestedMedia==='audiobook' && ebookTypes.includes(fileType))) {
      throw new ProbeError('invalid-response','Result file type contradicts requested media');
    }
    if (requirements.audioFormat && row.audioFormat!==requirements.audioFormat) {
      throw new ProbeError('invalid-response','Missing requested source-reported audio format');
    }
    if (cfg.fileType && !requirements.format && row.fileType !== cfg.fileType) throw new ProbeError('invalid-response','Missing or contradictory file type');
  }
  return payload.results.length;
}

function targetsFor({all,only}) {
  const targets = new Map();
  for (const spec of PRESETS.filter(p => all || p.status !== 'candidate')) {
    const conf = resolveConfiguration(spec);
    for (const source of spec.sources) {
      if (only && !only.includes(source)) continue;
      const cfg = PROVIDERS[source];
      const media = cfg.media==='all' ? conf.media : cfg.media;
      const key = [source,conf.lang,media,conf.format || '',conf.audioFormat || '',conf.profile].join('|');
      if (!targets.has(key)) targets.set(key,{source,spec,conf,media});
    }
  }
  return [...targets.values()];
}

async function searchProbe(target,fetchImpl) {
  const {spec,source,conf,media} = target;
  const request = makePreset(spec).search.request;
  const url = new URL(request.url);
  url.searchParams.delete('preset');
  url.searchParams.delete('shelfbridgePreset');
  url.searchParams.set('sources',backendSourceId(source));
  url.searchParams.set('debrid',PROVIDERS[source].method);
  const title = ['comic','comics','manga'].includes(media) ? 'One Piece'
    : media==='magazine' ? 'Science' : media==='webnovel' ? 'Mother of Learning' : 'Frankenstein';
  const body = {...request.body,title,author:title==='Frankenstein' && conf.lang==='en' ? 'Mary Shelley' : '',contentType:media,limit:3};
  delete body.preset;
  delete body.shelfbridgePreset;
  const signal = AbortSignal.timeout(20000);
  // One shared deadline across retries; rate limits and account refusals never retry.
  for (let attempt=0; attempt<3; attempt++) {
    try {
      const res = await fetchImpl(url.href,{method:'POST',redirect:'error',
        headers:request.headers,body:JSON.stringify(body),signal});
      if (!res.ok) { await res.body?.cancel(); throw httpError(res.status); }
      // Limit bytes while reading, rather than buffering an unbounded response first.
      const reader = res.body?.getReader();
      if (!reader) throw new ProbeError('invalid-response','Search response has no body');
      const chunks=[]; let total=0;
      try {
        for (;;) {
          const {done,value}=await reader.read();
          if (done) break;
          total+=value.byteLength;
          if(total>2000000) throw new ProbeError('invalid-response','Oversized search response');
          chunks.push(value);
        }
      } finally { await reader.cancel(); }
      let payload;
      try { payload=JSON.parse(Buffer.concat(chunks).toString('utf8')); }
      catch { throw new ProbeError('invalid-response','Malformed search JSON'); }
      return payload;
    } catch(error) {
      const transient=error.code==='upstream-unavailable' || error instanceof TypeError;
      if(!transient || attempt===2 || signal.aborted) throw error;
      await sleep(500*(attempt+1));
    }
  }
}

function safeFailure(error) {
  if (error instanceof ProbeError) return {reason:error.code,error:error.message};
  if (error?.name==='TimeoutError' || error?.name==='AbortError') return {reason:'timeout',error:'Probe deadline exceeded'};
  return {reason:'network-error',error:'Probe network request failed'};
}

export async function runHealth({downloadCheck=true,all=false,only,fetchImpl=globalThis.fetch,paceMs}={}) {
  const checks=[], nextAllowed=new Map();
  for (const target of targetsFor({all,only})) {
    const {source,spec,conf,media}=target;
    const delay = Math.max(0,(nextAllowed.get(source)||0)-Date.now());
    if (delay) await sleep(delay);
    const started=Date.now();
    const base={source,language:conf.lang,media,format:conf.format || null,preset:spec.file};
    try {
      const payload=await searchProbe(target,fetchImpl);
      const resultCount=validateProbe(payload,source,conf.lang,{...conf,media});
      let download={evidence:'not-checked',transferVerified:false};
      if(downloadCheck) download=await verifyDownload(destination(payload.results[0]),{source,fetchImpl});
      checks.push({...base,status:'passed',search:'passed',resultCount,download,elapsedMs:Date.now()-started});
    } catch(error) {
      const failure=safeFailure(error);
      checks.push({...base,status:failure.reason==='unreviewed' ? 'unverified' : 'failed',...failure,elapsedMs:Date.now()-started});
    }
    nextAllowed.set(source,Date.now()+(paceMs ?? Math.ceil(60000/PROVIDERS[source].rpm)));
  }
  const failed=checks.filter(c=>c.status!=='passed');
  return {checkedAt:new Date().toISOString(),
    scope:'Source/media/language/format/profile canaries; HEAD is headers-only and magnets are syntax-only. Transfers and native apps are unverified.',
    probed:checks.length,failedSources:[...new Set(failed.map(c=>c.source))],
    failedPairs:failed.map(c=>[c.source,c.language,c.media,c.format||''].join('|')),checks};
}

if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  const onlyArg=process.argv.find(arg=>arg.startsWith('--only='));
  const report=await runHealth({downloadCheck:!process.argv.includes('--no-download'),
    all:process.argv.includes('--all'),only:onlyArg?.slice(7).split(',')});
  console.log(JSON.stringify(report,null,2));
  if(report.failedSources.length) process.exitCode=1;
}

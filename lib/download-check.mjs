import { PROVIDERS } from '../sources.mjs';

export class ProbeError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

export function validateMagnet(raw) {
  let url;
  try { url = new URL(raw); } catch { throw new ProbeError('invalid-destination','Invalid magnet URL'); }
  if (url.protocol !== 'magnet:' || !url.searchParams.getAll('xt').some(
    xt => /^urn:btih:(?:[a-f0-9]{40}|[a-z2-7]{32})$/i.test(xt)
  )) throw new ProbeError('invalid-destination','Magnet has no valid torrent identity');
}

export function reviewedUrl(raw, source, { requirePolicy = true, filePath = false } = {}) {
  const cfg = PROVIDERS[source];
  if (!cfg) throw new ProbeError('unsupported','Unknown provider');
  let url;
  try { url = new URL(raw); } catch { throw new ProbeError('invalid-destination','Invalid destination URL'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port ||
      url.hostname === 'localhost' || /^[\d.]+$/.test(url.hostname) || url.hostname.includes(':')) {
    throw new ProbeError('invalid-destination','Unreviewed destination');
  }
  const hostedFile = ['annas','zlib','libgenli','libgen','libgenfiction'].includes(source) &&
    url.hostname === 'search.inkecho.duckdns.org' && !url.search && !url.hash &&
    /^\/dl\/(?:md5|annas)\/[a-f0-9]{32}\.(?:epub|pdf|mobi|azw3?|djvu|fb2|txt)$/i.test(url.pathname);
  if (hostedFile) return url;
  if (!cfg.hosts?.length && requirePolicy) throw new ProbeError('unreviewed','Provider destination policy has not been reviewed');
  if (cfg.hosts?.length && !cfg.hosts.some(host => url.hostname === host || url.hostname.endsWith('.'+host))) {
    throw new ProbeError('invalid-destination','Unreviewed destination host');
  }
  if (filePath && cfg.pathPattern) {
    let pathname;
    try { pathname = decodeURIComponent(url.pathname); } catch { throw new ProbeError('invalid-destination','Invalid destination encoding'); }
    if (!new RegExp(cfg.pathPattern).test(pathname)) throw new ProbeError('invalid-destination','Not a reviewed file path');
  }
  return url;
}

const FILE_TYPES = new Set([
  'application/epub+zip','application/pdf','application/zip','application/x-zip-compressed',
  'application/octet-stream','application/x-mobipocket-ebook','application/vnd.amazon.ebook',
  'application/x-cbz','application/x-cbr','application/vnd.comicbook+zip','application/vnd.comicbook-rar',
  'audio/mpeg','audio/mp4','audio/x-m4a','audio/flac','audio/ogg','audio/aac'
]);

// A HEAD validates headers only. It never proves a completed transfer or native-open success.
export async function verifyDownload(raw, { source, fetchImpl = globalThis.fetch } = {}) {
  if (raw.startsWith('magnet:')) {
    validateMagnet(raw);
    return { type:'magnet', length:0, evidence:'syntax-only', transferVerified:false };
  }
  let url = reviewedUrl(raw,source,{filePath:true});
  const signal = AbortSignal.timeout(8000);
  for (let hop=0; hop<=5; hop++) {
    const res = await fetchImpl(url.href,{method:'HEAD',redirect:'manual',signal});
    await res.body?.cancel();
    if ([301,302,303,307,308].includes(res.status)) {
      const location = res.headers.get('location');
      if (!location || hop===5) throw new ProbeError('invalid-destination','Download redirect limit or missing destination');
      url = reviewedUrl(new URL(location,url).href,source);
      continue;
    }
    if (!res.ok) throw httpError(res.status);
    const type = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!FILE_TYPES.has(type)) throw new ProbeError('invalid-file','Unverified file media type');
    const length = Number(res.headers.get('content-length'));
    if (!Number.isSafeInteger(length) || length<1024) throw new ProbeError('invalid-file','Missing or suspicious file length');
    return {type,length,evidence:'headers-only',transferVerified:false};
  }
}

export function httpError(status) {
  const code = status===401 ? 'authentication-required' : status===403 ? 'access-denied'
    : status===429 ? 'rate-limited' : status>=500 ? 'upstream-unavailable' : 'http-error';
  return new ProbeError(code,'HTTP '+status);
}

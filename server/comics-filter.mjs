// Only provider/file evidence counts. Request contentType and inferred mediaKind
// are deliberately excluded: the search pipeline can assign those from a request.
const comicWords = /\b(?:comics?|manga|manhwa|manhua|graphic[\s_-]*novels?|scanlations?|tank[oō]bon)\b/i;
const nonReadingMedia = /\b(?:mkv|mp4|avi|webm|mov|m4b|mp3|m4a|aac|flac|opus|aax|wav|audiobooks?|audio[\s_-]*books?|soundtrack|1080p|720p|2160p|web[ ._-]*dl|bluray|bdrip|hdtv|x26[45]|hevc)\b/i;
const textValues = value => Array.isArray(value) ? value.flatMap(textValues) : value && typeof value === 'object' ? [value.name, value.label, value.id].flatMap(textValues) : value == null ? [] : [String(value)];

export function isComicsRequest(body = {}, url) {
  return [body.media, body.contentType, body.type, url?.searchParams.get('media'), url?.searchParams.get('contentType')].some(value => /^(?:comics?|manga)$/i.test(String(value || '').trim()));
}

export function normalizeComicsRequest(body = {}, url) {
  if (!isComicsRequest(body, url)) return body;
  const shelf = comicShelf(body, url);
  if (url) {
    url.searchParams.set('media', 'comics');
    url.searchParams.set('comicFilter', 'evidence-v1');
    if (shelf !== 'both') url.searchParams.set('comicShelf', shelf);
  }
  return {...body, media:'comics', contentType:'comics', comicShelf:shelf};
}

export function comicShelf(body = {}, url) {
  const value = String(url?.searchParams.get('comicShelf') || body.comicShelf || 'both').toLowerCase();
  return ['manga','comics'].includes(value) ? value : 'both';
}

// A CBZ/CBR extension establishes a graphic file, not its subtype. Unknown
// subtypes stay in the combined preset; request text is never evidence.
export function comicResultShelf(item) {
  const title = [item.originalTitle || item.releaseTitle || item.name || item.title,
    item.filename,item.fileName].flatMap(textValues).join(' ');
  const categories = [item.category,item.categories,item.categoryName,item.tags].flatMap(textValues).join(' ');
  const evidence = `${title} ${categories}`;
  if (/\b(?:manga|manhwa|manhua|scanlations?|tank[oō]bon)\b/i.test(evidence)) return 'manga';
  const source = String(item.source || item.provider || '').toLowerCase();
  if (source === 'nyaa' || /\bnyaa\b/i.test(String(item.indexer || ''))) return 'manga';
  // Shared indexers put manga in Books/Comics and the display pipeline adds a
  // generic "comic" tag to CBZ/CBR files. Neither establishes Western comics.
  if (source === 'getcomics' || /\b(?:comics?|graphic[\s_-]*novels?)\b/i.test(title) || /\bwestern[\s_-]*comics?\b/i.test(categories)) return 'comics';
  return 'unknown';
}

export function isComicMangaResult(item) {
  if (!item || typeof item !== 'object') return false;
  const files = (Array.isArray(item.files) ? item.files : []).flatMap(file => typeof file === 'string' ? [file] : [file?.name,file?.path,file?.filename,file?.format]);
  const titleEvidence = [item.originalTitle || item.releaseTitle || item.name || item.title,item.filename,item.fileName,...files].flatMap(textValues).join(' ');
  const evidence = [titleEvidence,item.format,item.fileFormat,item.fileType,item.extension].flatMap(textValues).join(' ');
  const categories = [item.category,item.categories,item.categoryName,item.tags].flatMap(textValues).join(' ');
  const paths = [item.url,item.downloadUrl,item.directDownloadUrl,item.ebookUrl,item.audioUrl].flatMap(value=>{try{return [new URL(value).pathname];}catch{return [];}});
  // A comic word in a movie/audio release does not make it a readable comic.
  if (nonReadingMedia.test(`${evidence} ${categories} ${paths.join(' ')}`)) return false;
  if (/\b(?:cbz|cbr)\b/i.test(evidence)) return true;
  // File URLs count only by their path extension, never by query text or hostname.
  for (const value of [item.url,item.downloadUrl,item.directDownloadUrl,item.ebookUrl]) {
    try {if (/\.(?:cbz|cbr)$/i.test(new URL(value).pathname)) return true;} catch {}
  }
  return comicWords.test(`${titleEvidence} ${categories}`) || textValues(item.categories).includes('7030') || String(item.category || '') === '7030';
}

// Prose ebook presets opt in with media=ebook. The public sanitizer strips body
// fields, and existing presets must keep their results, so only the URL counts.
export function isProseEbookRequest(body = {}, url) {
  return /^e-?books?$/i.test(String(url?.searchParams.get('media') || '').trim());
}

// Stricter than isComicMangaResult: a bare "comic" word ("A Comic History of
// England") or the display pipeline's generic comic tag is not evidence here.
const graphicEditionWords = /\b(?:manga|manhwa|manhua|graphic[\s_-]*novels?|scanlations?|tank[oō]bon)\b/i;
export function isProseExcludedComic(item) {
  if (!item || typeof item !== 'object') return false;
  const files = (Array.isArray(item.files) ? item.files : []).flatMap(file => typeof file === 'string' ? [file] : [file?.name,file?.path,file?.filename,file?.format]);
  const fileEvidence = [item.format,item.fileFormat,item.fileType,item.extension,item.filename,item.fileName,...files].flatMap(textValues).join(' ');
  if (/\b(?:cbz|cbr)\b/i.test(fileEvidence)) return true;
  for (const value of [item.url,item.downloadUrl,item.directDownloadUrl,item.ebookUrl]) {
    try {if (/\.(?:cbz|cbr)$/i.test(new URL(value).pathname)) return true;} catch {}
  }
  const source = String(item.source || item.provider || '').toLowerCase();
  if (source === 'getcomics') return true;
  if (source === 'nyaa' && !/\bepub\b/i.test(fileEvidence)) return true;
  if (textValues(item.categories).includes('7030') || String(item.category || '') === '7030') return true;
  const title = [item.originalTitle || item.releaseTitle || item.name || item.title].flatMap(textValues).join(' ');
  const categories = [item.category,item.categories,item.categoryName].flatMap(textValues).join(' ');
  return graphicEditionWords.test(`${title} ${categories}`);
}

export function filterComicsPayload(payload, body = {}, url) {
  if (!payload || typeof payload !== 'object') return payload;
  if (isProseEbookRequest(body, url)) {
    const next = {...payload};
    for (const key of ['results','streams']) if (Array.isArray(next[key])) next[key] = next[key].filter(row => !isProseExcludedComic(row));
    if (Array.isArray(next.results)) {
      next.proseEbookFilteredCount = (Number(payload.proseEbookFilteredCount) || 0) + payload.results.length - next.results.length;
      recountSources(next);
    }
    return next;
  }
  if (!isComicsRequest(body, url)) return payload;
  const next = {...payload};
  const shelf = comicShelf(body, url);
  const keep = row => isComicMangaResult(row) && (shelf === 'both' || comicResultShelf(row) === shelf);
  for (const key of ['results','streams']) if (Array.isArray(next[key])) next[key] = next[key].filter(keep);
  next.comicShelf = shelf;
  if (Array.isArray(next.results)) {
    next.comicsFilteredCount = (Number(payload.comicsFilteredCount) || 0) + payload.results.length - next.results.length;
    recountSources(next);
  }
  return next;
}

function recountSources(next) {
  next.resultCount = next.results.length;
  const counts = new Map();
  for (const row of next.results) {
    const source = row.source || row.provider || 'unknown';
    const entry = counts.get(source) || {source,label:row.sourceLabel || source,count:0};
    entry.count++;
    counts.set(source,entry);
  }
  next.sources = [...counts.values()];
  next.sourceCount = next.sources.length;
  if (Array.isArray(next.providerStatus)) next.providerStatus = next.providerStatus.map(row => ({...row,count:next.results.filter(item=>item.source === row.id).length,resultVerified:next.results.some(item=>item.source === row.id)}));
}

export function selectComicResults(rows, body = {}, url, limit = rows.length) {
  return filterComicsPayload({results:rows},body,url).results.slice(0,limit);
}

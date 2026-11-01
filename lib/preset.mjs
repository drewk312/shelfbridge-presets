import { MAPPING, exclusionsFor } from '../mapping.mjs';
import { PROVIDERS } from '../sources.mjs';

// pages.dev upstream is empty; all live search goes through the VPS public routes.
const ORIGIN = 'https://search.inkecho.duckdns.org';
const RAW_BASE = 'https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/';
const LAWFUL = 'Use sources only for content you are legally entitled to access.';
const ICON = 'https://i.ibb.co/wJ13Y1y/logo.png';
const CACHE_BUST = 'source-speed-v4';
const ARCH = 'bounded-distinct-providers-v4';
const BUILT_AT = '2026-11-01T03:25:00.000Z';

// The backend and the shipping presets speak the legacy source ids.
const LEGACY_SOURCE_ID = {
  abb: 'audiobookbay',
  solid: 'solidtorrents',
  tcsv: 'torrentcsv',
  tgalaxy: 'torrentgalaxy',
  gutenberg: 'gutendex'
};

export const rpmFor = spec => Math.min(...spec.sources.map(s => PROVIDERS[s].rpm));

// Mixed presets declare "both" exactly like the shipping Ink & Echo files.
function mediaOf(spec) {
  if (spec.comicShelf) return spec.comicShelf === 'manga' ? 'manga' : 'comic';
  const set = new Set(spec.contentTypes);
  if (set.has('ebook') && set.has('audiobook')) return 'both';
  return spec.contentTypes[0];
}

// The edge router only serves all, ebook and audiobook; magazines ride the all path.
// Comics/manga use the ebook route with media=comics so the comics filter runs.
const mediaPath = media => {
  if (media === 'ebook' || media === 'audiobook') return media;
  if (media === 'manga' || media === 'comic' || media === 'comics') return 'ebook';
  return 'all';
};

const sourceIds = spec => spec.sources.map(s => LEGACY_SOURCE_ID[s] || s);

function buildRequest(spec, media) {
  const origin = spec.origin || ORIGIN;
  const comic = media === 'manga' || media === 'comic' || media === 'comics' || !!spec.comicShelf;
  const url = new URL('/public/' + mediaPath(media) + '/search', origin);
  url.searchParams.set('debrid', spec.downloadMethod);
  url.searchParams.set('profile', spec.profile || 'best');
  url.searchParams.set('client', 'ink-hosted');
  url.searchParams.set('cacheBust', comic ? 'comics-preset-resolve-v1' : CACHE_BUST);
  url.searchParams.set('torboxTier', 'standard');
  url.searchParams.set('titleStyle', 'clean');
  // Stable preset id: VPS expands sources/shelf/routing server-side so phones
  // do not need to re-import JSON when we change backends.
  const presetId = (spec.file || '').replace(/\.json$/, '') || spec.id;
  url.searchParams.set('preset', presetId);
  url.searchParams.set('sources', sourceIds(spec).join(','));
  url.searchParams.set('lang', comic ? (spec.language === 'en' ? 'any' : spec.language) : spec.language);
  if (!comic) url.searchParams.set('languageMode', 'strict');
  if (comic) {
    url.searchParams.set('media', 'comics');
    url.searchParams.set('comicShelf', spec.comicShelf || (media === 'manga' ? 'manga' : 'comics'));
  }
  if (spec.audioFormat) url.searchParams.set('audioFormat', spec.audioFormat);
  const body = {
    title: '{TITLE}',
    author: '{AUTHOR}',
    limit: spec.limit,
    contentType: comic ? 'comics' : media,
    preset: presetId
  };
  if (comic) {
    body.media = 'comics';
    body.comicShelf = spec.comicShelf || (media === 'manga' ? 'manga' : 'comics');
  }
  if (spec.audioFormat) body.audioFormat = spec.audioFormat;
  return {
    method: 'POST',
    url: url.href,
    // Backend answers ~10s with all sources still racing; leave headroom for mobile.
    timeout: spec.requestTimeout || 22000,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body
  };
}

// One adapter object, referenced three times, serialised three times.
// Rate limit always comes from the slowest member so bundles never over-drive a source.
export function makePreset(spec) {
  const media = mediaOf(spec);
  const contentTypes = media === 'both' ? ['audiobook', 'ebook'] : [media];
  const direct = spec.downloadMethod === 'direct';
  const rpm = rpmFor(spec);
  const origin = spec.origin || ORIGIN;
  const adapter = {
    cacheNotifyUrl: origin + '/public/' + mediaPath(media) + '/debrid-notify',
    request: buildRequest(spec, media),
    response: { type: 'json', resultsPath: 'results', mapping: MAPPING }
  };
  const hostedProviderUrl = RAW_BASE + spec.file;

  return {
    schemaVersion: '1.0.0',
    kind: 'search',
    id: spec.id,
    name: spec.name,
    version: spec.version,
    description: spec.description,
    trustLabel: 'User Added',
    lawfulNote: LAWFUL,
    icon: ICON,
    provides: ['source', 'search'],
    contentType: media,
    contentTypes,
    debrid: spec.downloadMethod,
    debridChoice: spec.downloadMethod,
    debridServices: [spec.downloadMethod],
    selectedDebridService: spec.downloadMethod,
    downloadService: spec.downloadMethod,
    resolverCompatibility: {
      normalResults: direct ? ['direct'] : ['realdebrid', 'torbox'],
      torrentResults: direct ? [] : ['realdebrid', 'torbox'],
      directResults: ['direct', 'realdebrid', 'torbox'],
      usenetResults: [],
      note: spec.compatNote
    },
    discover: { sections: [] },
    meta: {
      builtAt: BUILT_AT,
      builder: 'ShelfBridge build.mjs',
      language: spec.language,
      torboxTier: 'standard',
      coverageProfile: 'best',
      resultLimit: spec.limit,
      requestTimeout: spec.requestTimeout || 22000,
      titleStyle: 'clean',
      hostedProviderUrl,
      searchArchitecture: ARCH,
      preset: spec.file.replace(/\.json$/, ''),
      languageMode: 'strict',
      ...(spec.sources.length > 1 ? { selectedSources: sourceIds(spec) } : { standaloneSource: sourceIds(spec)[0] }),
      sources: spec.sources,
      sourceContract: 'typed-media-v2',
      ...(spec.format ? { formatTarget: spec.format } : {}),
      ...(spec.audioFormat ? { audioFormat: spec.audioFormat } : {}),
      ...spec.meta
    },
    rateLimit: { requestsPerMinute: rpm, retryAfterMs: Math.max(6000, Math.ceil(60000 / rpm)) },
    matching: { algorithm: 'fuzzy', threshold: spec.threshold },
    adapters: { source: adapter, search: adapter },
    search: adapter,
    hostedProviderUrl,
    excludeTerms: exclusionsFor(media, spec.format)
  };
}

import { MAPPING, exclusionsFor } from '../mapping.mjs';
import { PROVIDERS } from '../sources.mjs';

const ORIGIN = 'https://inkandecho-builder.pages.dev';
// Per-media paths, byte-identical to the shipping preset files.
const RAW_BASE = 'https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/';
const LAWFUL = 'Use sources only for content you are legally entitled to access.';
const ICON = 'https://i.ibb.co/wJ13Y1y/logo.png';
const CACHE_BUST = 'source-stability-v2';
const ARCH = 'bounded-distinct-providers-v4';
const BUILT_AT = '2026-10-31T00:00:00.000Z';

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
  const set = new Set(spec.contentTypes);
  if (set.has('ebook') && set.has('audiobook')) return 'both';
  return spec.contentTypes[0];
}

// The edge router only serves all, ebook and audiobook; magazines and comics ride the all path.
const mediaPath = media => (media === 'ebook' || media === 'audiobook' ? media : 'all');

const sourceIds = spec => spec.sources.map(s => LEGACY_SOURCE_ID[s] || s);

function buildRequest(spec, media) {
  const url = new URL('/' + mediaPath(media) + '/search', ORIGIN);
  url.searchParams.set('debrid', spec.downloadMethod);
  url.searchParams.set('profile', spec.profile || 'best');
  url.searchParams.set('client', 'ink-hosted');
  url.searchParams.set('cacheBust', CACHE_BUST);
  url.searchParams.set('torboxTier', 'standard');
  url.searchParams.set('titleStyle', 'clean');
  url.searchParams.set('sources', sourceIds(spec).join(','));
  url.searchParams.set('lang', spec.language);
  url.searchParams.set('languageMode', 'strict');
  return {
    method: 'POST',
    url: url.href,
    timeout: 30000,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: { title: '{TITLE}', author: '{AUTHOR}', limit: spec.limit, contentType: media }
  };
}

// One adapter object, referenced three times, serialised three times.
// Rate limit always comes from the slowest member so bundles never over-drive a source.
export function makePreset(spec) {
  const media = mediaOf(spec);
  const contentTypes = media === 'both' ? ['audiobook', 'ebook'] : [media];
  const direct = spec.downloadMethod === 'direct';
  const rpm = rpmFor(spec);
  const adapter = {
    cacheNotifyUrl: ORIGIN + '/' + mediaPath(media) + '/debrid-notify',
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
      requestTimeout: 30000,
      titleStyle: 'clean',
      hostedProviderUrl,
      searchArchitecture: ARCH,
      preset: spec.file.replace(/\.json$/, ''),
      languageMode: 'strict',
      ...(spec.sources.length > 1 ? { selectedSources: sourceIds(spec) } : { standaloneSource: sourceIds(spec)[0] }),
      sources: spec.sources,
      sourceContract: 'typed-media-v2',
      ...(spec.format ? { formatTarget: spec.format } : {}),
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

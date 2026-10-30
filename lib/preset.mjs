import { MAPPING, exclusionsFor } from '../mapping.mjs';

const ORIGIN = 'https://search.inkecho.duckdns.org';
const SEARCH_PATH = '/public/all/search';
const RAW_BASE = 'https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/';
const LAWFUL = 'Use sources only for content you are legally entitled to access.';
const ICON = 'https://i.ibb.co/wJ13Y1y/logo.png';

function buildRequest(spec) {
  const url = new URL(SEARCH_PATH, ORIGIN);
  url.searchParams.set('debrid', spec.downloadMethod);
  url.searchParams.set('client', 'ink-hosted');
  url.searchParams.set('sources', spec.sources.join(','));
  url.searchParams.set('lang', 'en');
  url.searchParams.set('languageMode', 'strict');
  url.searchParams.set('profile', spec.profile || 'best');
  url.searchParams.set('cacheBust', `${spec.id}-v${spec.version}`);
  return {
    method: 'POST',
    url: url.href,
    timeout: 30000,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: { title: '{TITLE}', author: '{AUTHOR}', limit: spec.limit, contentType: spec.contentType }
  };
}

// One adapter object, referenced three times, serialised three times.
// Editing a preset now means editing one table row.
export function makePreset(spec) {
  const adapter = {
    request: buildRequest(spec),
    response: { type: 'json', resultsPath: 'results', mapping: MAPPING }
  };
  const hostedProviderUrl = RAW_BASE + spec.file;
  const direct = spec.downloadMethod === 'direct';

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
    contentType: spec.contentType,
    contentTypes: spec.contentTypes,
    debrid: spec.downloadMethod,
    debridChoice: spec.downloadMethod,
    debridServices: [spec.downloadMethod],
    selectedDebridService: spec.downloadMethod,
    downloadService: spec.downloadMethod,
    resolverCompatibility: {
      normalResults: direct ? [] : ['realdebrid', 'torbox'],
      torrentResults: direct ? [] : ['realdebrid', 'torbox'],
      directResults: ['direct'],
      usenetResults: [],
      note: spec.compatNote
    },
    discover: { sections: [] },
    meta: {
      sourceContract: 'typed-media-v2',
      builtBy: 'shelfbridge build.mjs',
      hostedProviderUrl,
      sources: spec.sources,
      language: 'en',
      languageMode: 'strict',
      resultLimit: spec.limit,
      ...spec.meta
    },
    rateLimit: { requestsPerMinute: spec.rpm, retryAfterMs: Math.ceil(60000 / spec.rpm) },
    matching: { algorithm: 'fuzzy', threshold: 0.3 },
    adapters: { source: adapter, search: adapter },
    search: adapter,
    hostedProviderUrl,
    excludeTerms: exclusionsFor(spec.contentType)
  };
}

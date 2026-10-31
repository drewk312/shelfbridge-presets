import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import { PROVIDERS, PRESETS } from './sources.mjs';
import { LANGUAGE_LABELS } from './mapping.mjs';

const RETRIES = 2;
const sleep = ms => new Promise(r => setTimeout(r, ms));

function languageMatches(value, language) {
  const pattern = LANGUAGE_LABELS[language];
  if (!pattern) throw new Error('Unknown preset language ' + language);
  return new RegExp(pattern, 'i').test(value || '');
}

export function validateProbe(payload, source, language = 'en') {
  const cfg = PROVIDERS[source];
  if (!cfg) throw new Error('Unknown provider');
  if (!Array.isArray(payload?.results) || payload.results.length === 0) throw new Error('No search results');
  for (const row of payload.results) {
    if (cfg.rowSource && row.source && row.source !== cfg.rowSource) throw new Error('Unexpected source ' + row.source);
    if (!languageMatches(row.language, language)) throw new Error('Unverified language: ' + (row.language || 'unknown'));
    if (row.downloadService !== cfg.method) throw new Error('Wrong download method');
    const raw = row.ebookUrl || row.audioUrl || row.url || row.downloadUrl || row.magnetUrl || row.magnet;
    if (!raw) throw new Error('No destination URL');
    if (raw.startsWith('magnet:')) {
      if (cfg.method !== 'torbox') throw new Error('Magnet from a direct source');
      continue;
    }
    const url = new URL(raw);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) throw new Error('Unreviewed destination');
    if (cfg.hosts && !cfg.hosts.some(h => url.hostname === h || url.hostname.endsWith('.' + h))) throw new Error('Unreviewed host ' + url.hostname);
    if (cfg.pathPattern && !new RegExp(cfg.pathPattern).test(decodeURIComponent(url.pathname))) throw new Error('Not a file path');
    if (cfg.fileType && row.fileType && row.fileType !== cfg.fileType) throw new Error('Expected ' + cfg.fileType);
  }
  return payload.results.length;
}

// Real download check: HEAD, follow redirects, demand a non-HTML body of sane size.
export async function verifyDownload(url) {
  if (url.startsWith('magnet:')) return { type: 'magnet', length: 0 };
  const res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(8000) });
  await res.body?.cancel();
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const type = res.headers.get('content-type') || '';
  if (/text\/html/i.test(type)) throw new Error('HTML page, not a file');
  const len = Number(res.headers.get('content-length') || 0);
  if (len && len < 1024) throw new Error('Suspiciously small: ' + len);
  return { type, length: len };
}

async function withRetry(fn) {
  let last;
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      last = error;
      const transient = /timeout|aborted|HTTP 5\d\d|HTTP 429|fetch failed|ECONNRESET/i.test(String(error.message));
      if (!transient || attempt === RETRIES) break;
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw last;
}

// Probes every (source, language) pair once, regardless of how many presets use it.
export async function runHealth({ downloadCheck = true, all = false, only } = {}) {
  const catalog = JSON.parse(readFileSync(new URL('./catalog.json', import.meta.url)));
  const picked = catalog.presets.filter(p => all || p.status !== 'candidate');

  const pairs = new Map();
  for (const p of picked) {
    for (const source of p.providers) {
      const key = source + '|' + p.language;
      if (!pairs.has(key)) pairs.set(key, { source, language: p.language, preset: p.file, contentType: p.searchBody ?? null });
    }
  }
  const targets = [...pairs.values()].filter(t => !only || only.includes(t.source));

  const checks = [];
  for (const target of targets) {
    const { source, language, preset } = target;
    const started = Date.now();
    try {
      const doc = JSON.parse(readFileSync(new URL(preset, import.meta.url)));
      const url = new URL(doc.search.request.url);
      url.searchParams.set('sources', source);
      const payload = await withRetry(async () => {
        const res = await fetch(url, {
          method: 'POST',
          redirect: 'error',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: language === 'en' ? 'Frankenstein' : 'Frankenstein',
            author: language === 'en' ? 'Mary Shelley' : '',
            contentType: doc.search.request.body.contentType,
            limit: 3
          }),
          signal: AbortSignal.timeout(20000)
        });
        if (!res.ok) { await res.body?.cancel(); throw new Error('HTTP ' + res.status); }
        const text = await res.text();
        if (text.length > 2000000) throw new Error('Oversized response');
        return JSON.parse(text);
      });
      const count = validateProbe(payload, source, language);
      let download = 'skipped';
      if (downloadCheck) {
        const row = payload.results[0];
        await verifyDownload(row.ebookUrl || row.audioUrl || row.url || row.downloadUrl || row.magnetUrl || row.magnet);
        download = 'passed';
      }
      checks.push({ source, language, preset, status: 'passed', resultCount: count, download, elapsedMs: Date.now() - started });
    } catch (error) {
      checks.push({ source, language, preset, status: 'failed', error: String(error.message).slice(0, 200), elapsedMs: Date.now() - started });
    }
    await sleep(1500);
  }
  const failed = checks.filter(c => c.status === 'failed');
  return {
    checkedAt: new Date().toISOString(),
    scope: 'One search contract probe and one real download check per source/language pair, paced',
    probed: checks.length,
    failedSources: [...new Set(failed.map(c => c.source))],
    failedPairs: failed.map(c => `${c.source}|${c.language}`),
    checks
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = await runHealth({
    downloadCheck: !process.argv.includes('--no-download'),
    all: process.argv.includes('--all')
  });
  console.log(JSON.stringify(report, null, 2));
  if (report.failedSources.length) process.exitCode = 1;
}

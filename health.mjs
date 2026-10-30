import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import { PROVIDERS } from './sources.mjs';

const isEnglish = v => /^(en(-[a-z]+)?|english)$/i.test(v || '');

export function validateProbe(payload, source) {
  const cfg = PROVIDERS[source];
  if (!cfg) throw new Error('Unknown provider');
  if (!Array.isArray(payload?.results) || payload.results.length === 0) throw new Error('No search results');
  for (const row of payload.results) {
    if (cfg.rowSource && row.source && row.source !== cfg.rowSource) throw new Error('Unexpected source ' + row.source);
    if (!isEnglish(row.language)) throw new Error('Unverified English language');
    if (row.downloadService !== cfg.method) throw new Error('Wrong download method');
    const raw = row.ebookUrl || row.audioUrl || row.url || row.downloadUrl;
    if (!raw) throw new Error('No destination URL');
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
  const res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(8000) });
  await res.body?.cancel();
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const type = res.headers.get('content-type') || '';
  if (/text\/html/i.test(type)) throw new Error('HTML page, not a file');
  const len = Number(res.headers.get('content-length') || 0);
  if (len && len < 1024) throw new Error('Suspiciously small: ' + len);
  return { type, length: len };
}

export async function runHealth({ downloadCheck = true, only } = {}) {
  const catalog = JSON.parse(readFileSync(new URL('./catalog.json', import.meta.url)));
  const targets = catalog.presets
    .filter(p => p.status !== 'candidate')
    .flatMap(p => p.providers.map(source => ({ p, source })))
    .filter(t => !only || only.includes(t.source));

  const checks = [];
  for (const { p, source } of targets) {
    const started = Date.now();
    try {
      const preset = JSON.parse(readFileSync(new URL(p.file, import.meta.url)));
      const url = new URL(preset.search.request.url);
      url.searchParams.set('sources', source);
      const res = await fetch(url, {
        method: 'POST',
        redirect: 'error',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Frankenstein',
          author: 'Mary Shelley',
          contentType: preset.search.request.body.contentType,
          limit: 3
        }),
        signal: AbortSignal.timeout(20000)
      });
      if (!res.ok) { await res.body?.cancel(); throw new Error('HTTP ' + res.status); }
      const text = await res.text();
      if (text.length > 2000000) throw new Error('Oversized response');
      const payload = JSON.parse(text);
      const count = validateProbe(payload, source);
      let download = 'skipped';
      if (downloadCheck) {
        const row = payload.results[0];
        await verifyDownload(row.ebookUrl || row.audioUrl || row.url || row.downloadUrl);
        download = 'passed';
      }
      checks.push({ preset: p.file, source, status: 'passed', resultCount: count, download, elapsedMs: Date.now() - started });
    } catch (error) {
      checks.push({ preset: p.file, source, status: 'failed', error: String(error.message).slice(0, 200), elapsedMs: Date.now() - started });
    }
  }
  const failed = checks.filter(c => c.status === 'failed');
  return {
    checkedAt: new Date().toISOString(),
    scope: 'Per-source search contract + one real download HEAD per source',
    failedSources: [...new Set(failed.map(c => c.source))],
    checks
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = await runHealth({ downloadCheck: !process.argv.includes('--no-download') });
  console.log(JSON.stringify(report, null, 2));
  if (report.failedSources.length) process.exitCode = 1;
}

# ShelfBridge

Shared JSON source presets. Generated, not hand-edited. No credentials, no private service code.

## Import a preset

Presets are listed in `catalog.json` with checksums and language. Import an individual preset URL, not the catalog.

Start with `all.json`. It covers every direct source, needs no resolver, and is the only preset most people need.

Format-targeted: `ebooks-kindle.json` (MOBI/AZW3), `ebooks-pdf.json`, `audiobooks-m4b.json`.

Per-source ebook: `ebooks-annas`, `ebooks-zlib`, `ebooks-libgen`, `ebooks-standardebooks`, `ebooks-gutenberg`.

Audiobooks: `audiobooks.json`, `fast-audiobooks.json`, `audiobooks-abb.json`, `librivox-audiobooks.json`.

Other languages: `ebooks-es`, `ebooks-fr`, `ebooks-de` (candidates until the backend language support is confirmed).

Candidates, unverified: `mobilism.json`, `manga.json`, `webnovels.json`.

Do not import a preset and its own superset together — `all.json` already contains the per-source ebook and LibriVox providers, so both would duplicate every query.

## Editing

Do not edit a preset JSON. Edit `sources.mjs` (or `mapping.mjs`) and run:

```
node build.mjs
node --test *.test.mjs
```

`build.mjs --check` fails when committed output no longer matches the table, so CI blocks drift. Each preset's `search`, `adapters.search` and `adapters.source` are serialised from one object and cannot diverge. Rate limits are derived from the slowest member provider, never typed by hand.

## Health

`node health.mjs` probes every source/language pair once — search contract, then a real HEAD against a returned file. Add `--all` to include candidates. Failures exit non-zero, list the pair, and the scheduled workflow files or updates a tracking issue.

Schedules can be delayed and GitHub disables them after long inactivity; `keepalive.yml` commits monthly to prevent that. Health checks are point-in-time, not an uptime guarantee.

Public-domain status varies by country. Use content you are legally entitled to access.

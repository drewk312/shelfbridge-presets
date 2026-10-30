# ShelfBridge

Shared JSON source presets. Generated, not hand-edited. No credentials, no private service code.

## Import a preset

Presets are listed in `catalog.json` with checksums. Import an individual preset URL, not the catalog.

Ebooks: `direct-ebooks.json` (broad), `fast-ebooks.json`, `public-domain-ebooks.json`, and one preset per source (`ebooks-annas`, `ebooks-zlib`, `ebooks-libgen`, `ebooks-standardebooks`, `ebooks-gutenberg`).

Audiobooks: `audiobooks.json`, `fast-audiobooks.json`, `audiobooks-abb.json`, `librivox-audiobooks.json`.

Everything: `all.json`.

Candidates (unverified backend support, kept out of bundles): `mobilism.json`, `manga.json`, `webnovels.json`.

## Editing

Do not edit a preset JSON. Edit `sources.mjs` (or `mapping.mjs`) and run:

```
node build.mjs
node --test preset.test.mjs catalog.test.mjs
```

`build.mjs --check` fails when committed output no longer matches the table, so CI blocks drift. Every preset's `search`, `adapters.search` and `adapters.source` are serialised from one object, so they cannot diverge.

## Health

`node health.mjs` walks `catalog.json` and probes every source of every pilot preset individually: search contract, then a real HEAD request against a returned file. Failures exit non-zero, list the source, and the scheduled workflow files or updates a tracking issue.

Schedules can be delayed and GitHub disables them after long inactivity; `keepalive.yml` commits monthly to prevent that. Health checks are point-in-time, not an uptime guarantee.

Public-domain status varies by country. Use content you are legally entitled to access.

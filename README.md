# ShelfBridge

Original, shared JSON source presets. Private service code is maintained separately. No Cinder extension code is included.

## Import an individual preset

- [Direct Ebooks](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/direct-ebooks.json): broad direct ebook pilot.
- [Public-domain Ebooks](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/public-domain-ebooks.json): Standard Ebooks and Project Gutenberg.
- [LibriVox Audiobook Archives](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/librivox-audiobooks.json): English ZIP bundles. Requires an app that supports archive extraction; not single-file audio streaming.
- [Mobilism Releases](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/mobilism.json): ebook and audiobook direct-download listings from a collected index. Backend source not yet deployed; downloads are unverified third-party host links.

All are pilots. Backend checks are not proof of native app compatibility. Do not migrate every user until import, search, download and refresh are verified for each app/version. Public-domain status varies by country; use content you are legally entitled to access.

`catalog.json` contains release metadata and checksums; it is not an app-importable preset. Existing URLs remain stable.

## Quality checks

Run `node --test *.test.mjs` for offline validation and `node health.mjs` for three bounded, read-only source searches. The health check fails on empty results, wrong-language results, wrong download methods or unreviewed link hosts. It checks search/result contracts, not complete downloads or native apps.

The GitHub Actions workflow runs validation on changes, plus live checks on pushes, manual runs and a daily schedule. See the repository Actions tab for the actual run status. Schedules can be delayed and GitHub may disable them after repository inactivity; this is not an uptime guarantee. No automated mirror replacement, source deletion, credential access, artifacts or cache storage is configured.

Only standard GitHub-hosted runners in this public repository are used. No paid service was added. The existing VPS still runs searches; GitHub hosts configuration and tests, not the search engine.

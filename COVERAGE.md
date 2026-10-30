# Coverage and release gates

Cinder's live catalogue (2026-10-29) lists 33 extensions. ShelfBridge ships 13 pilot presets over 8 providers plus 3 candidates. Preset count is not unique provider count; extension count is not download success rate.

Reference: https://raw.githubusercontent.com/TrexxyMon/cinder-extensions/main/repo.json

## Gates

- Separate direct files, torrents and account-required sources; never invent magnets.
- Strict English by default; unknown language must not silently become English.
- Reviewed domains and reviewed redirect destinations.
- Content-type exclusions: ebook presets exclude audio, audiobook presets exclude text.
- Pin each catalog entry to exact preset bytes and version.
- Record per-app import, search, download and refresh evidence before calling anything stable.
- Candidates stay out of bundles until the backend serves them.

## Open gaps

1. `mobilism` returns zero results; the collected index is not deployed. Downloads are third-party hosts and unverified.
2. `manga` and `royalroad` provider IDs are assumed from the Cinder catalogue and unconfirmed against this backend.
3. No native-app evidence exists for any preset; everything is `not-tested`.
4. Audio/Atmos coverage needs verified format metadata; a title appearing in an Atmos catalogue does not prove an Atmos download.
5. Z-Library credentials are never stored in a preset.

## Validation

`node build.mjs --check` and `node --test *.test.mjs` run offline. `node health.mjs` runs live per-source probes. Neither executes a native app.

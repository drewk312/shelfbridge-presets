# ShelfBridge

JSON search presets for ebooks, audiobooks, comics and magazines.

Import a preset's raw URL into your reader. `catalog.json` lists the available presets; it is not an import file.

Start with [all.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/all.json) for direct ebook sources and LibriVox archives. Z-Library downloads require an account and are kept separate. Audiobook torrent presets require a resolver. LibriVox ZIP files require extraction.

Avoid enabling overlapping presets: importing a bundle alongside its member sources can duplicate searches.

[Preset list](IMPORT-ALL.md) · [Coverage and status](COVERAGE.md) · [Custom server setup](DIY_SETUP.md)

## Development

Requires Node.js 22. No dependencies to install.

Edit `sources.mjs`, `mapping.mjs` or the builders, then run:

```sh
node build.mjs
node --test *.test.mjs
node build.mjs --check
```

The build updates presets, catalog checksums, server routing and documentation together. Release timestamps are explicit; builds do not depend on today's date.

## Monitoring

```sh
node health.mjs
node health.mjs --only=standardebooks,gutenberg
node health.mjs --all
```

The default checks pilots; `--all` includes candidates. Each probe isolates a source and keeps its language, format and media settings. Requests are paced per provider.

Search checks validate the returned contract. A successful HEAD checks file headers, not file contents. Magnet checks validate syntax, not torrent availability. Unreviewed destination policies are reported as unverified. These checks do not prove that a native reader can open the result.

Scheduled monitoring runs separately from build validation and uploads its report even on failure. It does not create commits or add bot contributors.

Only use content you are entitled to access. Account credentials belong in the app or backend, never in a public preset.

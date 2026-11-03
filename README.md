# ShelfBridge

JSON source presets for **Lantern & Leaf** and **Ink & Echo**.

Choose a file below. Its link opens the raw JSON URL to copy into your app. Import one provider at a time; 58 presets are listed.

[Validation](https://github.com/drewk312/shelfbridge-presets/actions/workflows/validate.yml) · [Source health](https://github.com/drewk312/shelfbridge-presets/actions/workflows/health.yml) · [Setup guide](DIY_SETUP.md) · [Coverage](COVERAGE.md)

## Import

**Ink & Echo:** Settings → Sources → import from remote JSON URL → Validate → Add. [Provider documentation](https://www.inkandecho.app/docs#source-providers).

**Lantern & Leaf:** use the source/provider URL importer. These files include both the top-level search definition and source/search adapters.

Start with [all.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/all.json) for direct ebooks and LibriVox archives, or [public-domain-all.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/public-domain-all.json) for Standard Ebooks, Gutenberg and LibriVox.

Direct means no torrent resolver. Z-Library is included in all.json and direct-ebooks.json; its downloads use the hosted backend. Torrent results need TorBox or a compatible resolver. LibriVox ZIP archives require extraction.

Avoid enabling a bundle alongside its member presets; that can duplicate searches.

## App and source support

The same JSON contains the request and response fields used by both apps. EPUB, PDF, audio, archives and comic files still depend on the reader's format support. The files are validated against the provider contract; native import, download and playback have not been verified for every preset.

The sections below contain pilot presets for testing. Source availability can change.

## Starter bundles

| JSON preset | Sources | Language | Access |
| --- | --- | --- | --- |
| [all.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/all.json) | Anna's Archive, Z-Library, LibGen, Standard Ebooks, Project Gutenberg, LibriVox | en | Direct |
| [public-domain-all.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/public-domain-all.json) | Standard Ebooks, Project Gutenberg, LibriVox | en | Direct |

## Ebooks

| JSON preset | Sources | Language | Access |
| --- | --- | --- | --- |
| [direct-ebooks.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/direct-ebooks.json) | Anna's Archive, Z-Library, LibGen, Standard Ebooks, Project Gutenberg | en | Direct |
| [fast-ebooks.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/fast-ebooks.json) | Anna's Archive, LibGen | en | Direct |
| [public-domain-ebooks.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/public-domain-ebooks.json) | Standard Ebooks, Project Gutenberg | en | Direct |
| [ebooks-kindle.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/ebooks-kindle.json) | Anna's Archive, Z-Library, LibGen, Standard Ebooks, Project Gutenberg | en | Direct |
| [ebooks-pdf.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/ebooks-pdf.json) | Anna's Archive, Z-Library, LibGen | en | Direct |
| [ebooks-annas.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/ebooks-annas.json) | Anna's Archive | en | Direct |
| [ebooks-zlib.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/ebooks-zlib.json) | Z-Library | en | Direct |
| [ebooks-libgen.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/ebooks-libgen.json) | LibGen | en | Direct |
| [ebooks-standardebooks.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/ebooks-standardebooks.json) | Standard Ebooks | en | Direct |
| [ebooks-gutenberg.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/ebooks-gutenberg.json) | Project Gutenberg | en | Direct |
| [ebooks-any.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/ebooks-any.json) | Anna's Archive, Z-Library, LibGen, Standard Ebooks, Project Gutenberg | any | Direct |
| [ebooks-epub.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/ebooks-epub.json) | Standard Ebooks, Project Gutenberg | en | Direct |
| [public-domain-ebooks-any.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/public-domain-ebooks-any.json) | Standard Ebooks, Project Gutenberg | any | Direct |
| [ebooks-knaben.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/ebooks-knaben.json) | Knaben | any | Torrent resolver |

## Audiobooks

| JSON preset | Sources | Language | Access |
| --- | --- | --- | --- |
| [audiobooks.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/audiobooks.json) | AudioBookBay, LibriVox | en | Torrent resolver |
| [audiobooks-any.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/audiobooks-any.json) | AudioBookBay, LibriVox | any | Torrent resolver |
| [fast-audiobooks.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/fast-audiobooks.json) | AudioBookBay | en | Torrent resolver |
| [audiobooks-abb.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/audiobooks-abb.json) | AudioBookBay | en | Torrent resolver |
| [audiobooks-m4b.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/audiobooks-m4b.json) | AudioBookBay | en | Torrent resolver |
| [audiobooks-atmos-m4b.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/audiobooks-atmos-m4b.json) | AudioBookBay | en | Torrent resolver |
| [librivox-audiobooks.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/librivox-audiobooks.json) | LibriVox | en | Direct |
| [audiobooks-knaben.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/audiobooks-knaben.json) | Knaben | any | Torrent resolver |

## Comics and manga

| JSON preset | Sources | Language | Access |
| --- | --- | --- | --- |
| [manga.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/manga.json) | Nyaa, Knaben | any | Torrent resolver |
| [comics.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/comics.json) | GetComics | any | Direct |
| [comics-manga.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/comics-manga.json) | Nyaa, Knaben | any | Torrent resolver |
| [comics-knaben.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/comics-knaben.json) | Knaben | any | Torrent resolver |

## Other bundles

| JSON preset | Sources | Language | Access |
| --- | --- | --- | --- |
| [mobilism.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/mobilism.json) | Mobilism | en | Direct |

## Experimental presets

Backend or download support is unconfirmed for these candidates.

<details>
<summary>Show 29 experimental .json presets</summary>

| JSON preset | Sources | Language | Access |
| --- | --- | --- | --- |
| [ebooks-bookracy.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/ebooks-bookracy.json) | Bookracy | en | Direct |
| [ebooks-mayberry.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/ebooks-mayberry.json) | Mayberry | en | Direct |
| [ebooks-oceanofpdf.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/ebooks-oceanofpdf.json) | OceanofPDF | en | Direct |
| [ebooks-elscione.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/ebooks-elscione.json) | ElScione Server | en | Direct |
| [ebooks-es.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/ebooks-es.json) | Anna's Archive, Z-Library, LibGen, Standard Ebooks, Project Gutenberg | es | Direct |
| [ebooks-fr.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/ebooks-fr.json) | Anna's Archive, Z-Library, LibGen, Standard Ebooks, Project Gutenberg | fr | Direct |
| [ebooks-de.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/ebooks-de.json) | Anna's Archive, Z-Library, LibGen, Standard Ebooks, Project Gutenberg | de | Direct |
| [ebooks-ro.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/ebooks-ro.json) | Anna's Archive, Z-Library, LibGen, Standard Ebooks, Project Gutenberg | ro | Direct |
| [ebooks-ar.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/ebooks-ar.json) | Anna's Archive, Z-Library, LibGen, Standard Ebooks, Project Gutenberg | ar | Direct |
| [audiobooks-ro.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/audiobooks-ro.json) | AudioBookBay, LibriVox | ro | Torrent resolver |
| [audiobooks-ar.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/audiobooks-ar.json) | AudioBookBay, LibriVox | ar | Torrent resolver |
| [mobilism-ro.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/mobilism-ro.json) | Mobilism | ro | Direct |
| [mobilism-ar.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/mobilism-ar.json) | Mobilism | ar | Direct |
| [magazines.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/magazines.json) | FreeMagazines | en | Direct |
| [webnovels.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/webnovels.json) | Royal Road | en | Direct |
| [ebooks-openlib.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/ebooks-openlib.json) | OpenLibrary | en | Direct |
| [ebooks-dbooks.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/ebooks-dbooks.json) | DBooks | en | Direct |
| [ebooks-libgen2.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/ebooks-libgen2.json) | LibGen alt | en | Direct |
| [ebooks-libgenfiction.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/ebooks-libgenfiction.json) | LibGen Fiction | en | Direct |
| [ebooks-manybooks.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/ebooks-manybooks.json) | ManyBooks | en | Direct |
| [ebooks-feedbooks.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/ebooks-feedbooks.json) | Feedbooks | en | Direct |
| [ebooks-pdfdrive.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/ebooks-pdfdrive.json) | PDFDrive | en | Direct |
| [ebooks-archiveorg.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/ebooks-archiveorg.json) | Internet Archive | en | Direct |
| [audiobooks-loyalbooks.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/audiobooks-loyalbooks.json) | Loyal Books | en | Direct |
| [audiobooks-tokyobook.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/audiobooks-tokyobook.json) | Tokybook | en | Direct |
| [audiobooks-golden.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/audiobooks-golden.json) | Golden Audiobooks | en | Direct |
| [audiobooks-bookaudiobooks.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/audiobooks-bookaudiobooks.json) | BookAudiobooks | en | Direct |
| [audiobooks-4soul.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/audiobooks-4soul.json) | Audiobooks4Soul | en | Direct |
| [audiobooks-fulllength.json](https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/audiobooks-fulllength.json) | FullLengthAudiobooks | en | Direct |

</details>

## Development

Requires Node.js 22. Edit sources.mjs, mapping.mjs or the builders, then run:

```sh
node build.mjs
node --test *.test.mjs
node build.mjs --check
```

The build updates every preset, catalog checksum, registry and this list together. catalog.json is a catalog, not an app import file.

## Monitoring

```sh
node health.mjs
node health.mjs --only=standardebooks,gutenberg
node health.mjs --all
```

HEAD checks validate file headers; magnet checks validate syntax. They do not prove a complete transfer or playback. Scheduled checks run independently of build validation and create no commits.

Credentials belong in the app or backend, never in public presets. Only use content you are entitled to access.

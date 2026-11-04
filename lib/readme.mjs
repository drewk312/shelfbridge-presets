import { PRESETS, PROVIDERS } from '../sources.mjs';
import { resolveConfiguration } from './configuration.mjs';

const BASE = 'https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/';
const GROUPS = [
  ['Starter bundles',p=>p.file.startsWith('best-') || p.file==='all.json' || p.file==='public-domain-all.json'],
  ['Ebooks',p=>p.contentType==='ebook'],
  ['Audiobooks',p=>p.contentType==='audiobook'],
  ['Comics and manga',p=>!!p.comicShelf],
  ['Magazines and web fiction',p=>['magazine','webnovel'].includes(p.contentType)],
  ['Other bundles',()=>true]
];

function table(presets) {
  return [
    '| JSON preset | Sources | Language | Access |',
    '| --- | --- | --- | --- |',
    ...presets.map(p=>{
      const conf=resolveConfiguration(p);
      const sources=p.sources.map(id=>PROVIDERS[id].label).join(', ');
      const access=p.downloadMethod==='direct' ? 'Direct' : 'Torrent resolver';
      return '| ['+p.file+']('+BASE+p.file+') | '+sources+' | '+conf.lang+' | '+access+' |';
    })
  ].join('\n');
}

export function renderReadme() {
  const remaining=new Set(PRESETS.filter(p=>p.status!=='candidate'));
  const groups=GROUPS.map(([title,include])=>{
    const selected=[...remaining].filter(include);
    for(const p of selected)remaining.delete(p);
    return selected.length ? '## '+title+'\n\n'+table(selected) : '';
  }).filter(Boolean).join('\n\n');
  const candidates=PRESETS.filter(p=>p.status==='candidate');
  return '# ShelfBridge\n\n'
    +'JSON source presets for **Lantern & Leaf** and **Ink & Echo**.\n\n'
    +'Choose a file below. Its link opens the raw JSON URL to copy into your app. Import one provider at a time; '+String(PRESETS.length)+' presets are listed.\n\n'
    +'[Validation](https://github.com/drewk312/shelfbridge-presets/actions/workflows/validate.yml) · [Source health](https://github.com/drewk312/shelfbridge-presets/actions/workflows/health.yml) · [Setup guide](DIY_SETUP.md) · [Coverage](COVERAGE.md)\n\n'
    +'## Import\n\n'
    +'**Ink & Echo:** Settings → Sources → import from remote JSON URL → Validate → Add. [Provider documentation](https://www.inkandecho.app/docs#source-providers).\n\n'
    +'**Lantern & Leaf:** use the source/provider URL importer. These files include both the top-level search definition and source/search adapters.\n\n'
    +'Start with [all.json]('+BASE+'all.json) for direct ebooks and LibriVox archives, or [public-domain-all.json]('+BASE+'public-domain-all.json) for Standard Ebooks, Gutenberg and LibriVox.\n\n'
    +'Direct means no torrent resolver. Z-Library is included in all.json and direct-ebooks.json; its downloads use the hosted backend. Torrent results need TorBox or a compatible resolver. LibriVox ZIP archives require extraction.\n\n'
    +'Avoid enabling a bundle alongside its member presets; that can duplicate searches.\n\n'
    +'## App and source support\n\n'
    +'The same JSON contains the request and response fields used by both apps. EPUB, PDF, audio, archives and comic files still depend on the reader\'s format support. The files are validated against the provider contract; native import, download and playback have not been verified for every preset.\n\n'
    +'The sections below contain pilot presets for testing. Source availability can change.\n\n'
    +groups+'\n\n'
    +'## Experimental presets\n\n'
    +'Backend or download support is unconfirmed for these candidates.\n\n'
    +'<details>\n<summary>Show '+candidates.length+' experimental .json presets</summary>\n\n'
    +table(candidates)+'\n\n</details>\n\n'
    +'## Development\n\n'
    +'Requires Node.js 22. Edit sources.mjs, mapping.mjs or the builders, then run:\n\n'
    +'\x60\x60\x60sh\nnode build.mjs\nnode --test *.test.mjs\nnode build.mjs --check\n\x60\x60\x60\n\n'
    +'The build updates every preset, catalog checksum, registry and this list together. catalog.json is a catalog, not an app import file.\n\n'
    +'## Monitoring\n\n'
    +'\x60\x60\x60sh\nnode health.mjs\nnode health.mjs --only=standardebooks,gutenberg\nnode health.mjs --all\n\x60\x60\x60\n\n'
    +'HEAD checks validate file headers; magnet checks validate syntax. They do not prove a complete transfer or playback. Scheduled checks run independently of build validation and create no commits.\n\n'
    +'Credentials belong in the app or backend, never in public presets. Only use content you are entitled to access.\n';
}

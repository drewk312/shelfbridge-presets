// Effective routing contract shared by preset, catalog, registry and health generation.
const LEGACY = { abb: 'audiobookbay', gutenberg: 'gutendex' };
export const backendSourceId = id => LEGACY[id] || id;

export function resolveConfiguration(spec) {
  const comic = !!spec.comicShelf;
  const lang = comic && spec.language === 'en' ? 'any' : spec.language;
  const languageMode = lang === 'any' ? 'any' : (spec.languageMode || 'strict');
  const mixed = spec.contentTypes.includes('ebook') && spec.contentTypes.includes('audiobook');
  const media = comic ? 'comics' : mixed ? 'all'
    : spec.contentTypes.includes('audiobook') ? 'audiobook' : 'ebook';
  return {
    sources: spec.sources.map(backendSourceId).join(','),
    debrid: spec.downloadMethod,
    profile: spec.profile || 'best',
    lang,
    languageMode,
    media,
    ...(comic ? { comicShelf: spec.comicShelf } : {}),
    ...(spec.format ? { format: spec.format } : {}),
    ...(spec.audioFormat ? { audioFormat: spec.audioFormat } : {}),
    ...(spec.audioVerification ? { audioVerification: spec.audioVerification } : {})
  };
}

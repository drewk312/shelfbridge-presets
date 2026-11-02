// Canonical result-field map. Superset of what the shipping Ink & Echo presets
// already send, so nothing the backend returns is discarded.
export const MAPPING = {
  title: "fileTypeTitle",
  fileTypeTitle: "fileTypeTitle",
  displayTitle: "displayTitle",
  cleanTitle: "cleanTitle",
  author: "author",
  creator: "creator",
  writer: "writer",
  authors: "authors",
  authorKnown: "authorKnown",
  authorStatus: "authorStatus",
  narrator: "narrator",
  sizeBytes: "sizeBytes",
  size: "size",
  bytes: "bytes",
  fileSize: "fileSize",
  fileSizeBytes: "fileSizeBytes",
  sizeLabel: "sizeLabel",
  seeders: "seeders",
  seeds: "seeds",
  seedCount: "seedCount",
  seed_count: "seed_count",
  seeders_count: "seeders_count",
  seedersKnown: "seedersKnown",
  seedersDisplay: "seedersDisplay",
  leechers: "leechers",
  leeches: "leeches",
  leechCount: "leechCount",
  leecherCount: "leecherCount",
  peerCount: "peerCount",
  leechersKnown: "leechersKnown",
  leechersDisplay: "leechersDisplay",
  peers: "peers",
  availability: "availability",
  swarmStatus: "swarmStatus",
  swarmHealth: "swarmHealth",
  accessType: "accessType",
  isPreview: "isPreview",
  isFullText: "isFullText",
  format: "format",
  fileType: "fileType",
  fileTypes: "fileTypes",
  fileTypeLabel: "fileTypeLabel",
  fileFormat: "fileType",
  extension: "extension",
  bitrate: "bitrate",
  edition: "edition",
  language: "language",
  posted: "posted",
  date: "posted",
  isbn: "isbn",
  publisher: "publisher",
  pages: "pageCount",
  pageCount: "pageCount",
  cover: "artworkUrl",
  artworkUrl: "artworkUrl",
  previewUrl: "previewUrl",
  price: "price",
  currency: "currency",
  synopsis: "description",
  description: "description",
  summary: "summary",
  details: "details",
  debridCache: "debridCache",
  tags: "tags",
  qualityScore: "qualityScore",
  qualityTier: "qualityTier",
  quality: "quality",
  qualityLabel: "qualityLabel",
  qualitySummary: "qualitySummary",
  metadataCompleteness: "metadataCompleteness",
  metadataStatus: "metadataStatus",
  sourceLabel: "sourceLabel",
  source: "source",
  sourceName: "sourceName",
  provider: "provider",
  indexer: "indexer",
  alternateSources: "alternateSources",
  sourceCount: "sourceCount",
  mediaType: "mediaType",
  mediaKind: "mediaKind",
  verificationStatus: "verificationStatus",
  verificationLabel: "verificationLabel",
  matchVerification: "matchVerification",
  supportedServices: "supportedServices",
  resolverLabel: "resolverLabel",
  serviceLabel: "serviceLabel",
  compatibilityLabel: "compatibilityLabel",
  requiresTorBoxPro: "requiresTorBoxPro",
  requiresAccount: "requiresAccount",
  requiresExternalHost: "requiresExternalHost",
  accessNote: "accessNote",
  usenetOnly: "usenetOnly",
  url: "url",
  magnet: "magnetUrl",
  magnetUrl: "magnetUrl",
  infoHash: "infoHash",
  ebookUrl: "ebookUrl",
  audioUrl: "audioUrl",
  archiveUrl: "url",
  seedersStatus: "seedersStatus",
  leechersStatus: "leechersStatus",
  swarmApplicable: "swarmApplicable",
  downloadUrl: "downloadUrl",
  downloadService: "downloadService",
  sourcePageUrl: "sourcePageUrl",
};

export const ALLOWED_MAPPINGS = new Set(Object.keys(MAPPING));

const VIDEO = ["1080p", "720p", "2160p", "480p", "x264", "x265", "h264", "h265", "hevc", "bluray", "blu-ray", "bdrip", "brrip", "web-dl", "webrip", "hdtv", "hdrip", "dvdrip", "dvdscr", "camrip", "hdcam", "telesync", "xvid", "divx", "remux"];

const AUDIO = ["mp3", "m4b", "m4a", "flac", "ogg", "aac", "wav", "opus", "mp4", "m4v", "aax"];

const TEXT = ["epub", "pdf", "mobi", "azw", "azw3", "djvu", "fb2", "lit", "pdb", "cbz", "cbr", "cb7", "txt", "rtf", "doc", "docx"];

// Junk that clutters results: samples, previews, OCR text dumps, retail metadata.
const JUNK = ["sample", "preview", "excerpt", "scanned", "ocr", "retail"];

// Accepted language labels per preset language, for health validation.
export const LANGUAGE_LABELS = {
  "en": "^(en(-[a-z]+)?|english)$",
  "es": "^(es(-[a-z]+)?|spanish|español)$",
  "fr": "^(fr(-[a-z]+)?|french|français)$",
  "de": "^(de(-[a-z]+)?|german|deutsch)$",
  "ro": "^(ro(-[a-z]+)?|ron|rum|romanian|romana|română)$",
  "ar": "^(ar(-[a-z]+)?|ara|arabic|عربي|العربية)$",
  "any": ".*"
};

// content type and optional format target decide what gets filtered.
export function exclusionsFor(contentType, format) {
  const set = new Set([...VIDEO, ...JUNK]);
  if (contentType === 'ebook') AUDIO.forEach(t => set.add(t));
  if (contentType === 'audiobook') TEXT.forEach(t => set.add(t));
  if (format === 'kindle') TEXT.forEach(t => { if (!['mobi', 'azw', 'azw3'].includes(t)) set.add(t); });
  if (format === 'pdf') TEXT.forEach(t => { if (t !== 'pdf') set.add(t); });
  if (format === 'm4b') AUDIO.forEach(t => { if (t !== 'm4b') set.add(t); });
  return [...set].sort();
}

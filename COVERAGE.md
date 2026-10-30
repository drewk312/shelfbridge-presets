# Coverage and release gates

ShelfBridge is not yet broader than Cinder. The live Cinder catalog inspected on 2026-10-29 contains 33 extensions. ShelfBridge has three pilot presets; two reuse providers from the broader ebook preset, so preset count is not unique source count. Extension counts are not verified-download success rates.

Reference: https://raw.githubusercontent.com/TrexxyMon/cinder-extensions/main/repo.json

## What the comparison taught us

Cinder records extension versions, minimum Cinder versions, content types and source-specific scripts. Its Anna's Archive implementation uses Cinder fetch, browser, parsing and storage APIs. Its Z-Library implementation uses Cinder fetch and secure storage. Those runtime requirements do not disappear when a script URL is copied into a different app. No Cinder implementation was copied; the root LICENSE path returned 404, which is not permission to reuse code.

## ShelfBridge's release requirements

- Separate direct files, torrents and account-required sources; never invent magnets.
- Strict English by default; unknown language must not silently become English.
- Reviewed domains and reviewed redirect destinations; never approve a mirror solely because its name looks right.
- Validate import mappings against the actual app version, not just JSON syntax.
- Pin each catalog entry to exact preset bytes and version. Checksums are not signatures.
- Record per-app import, search, complete download and refresh tests before calling a release stable.
- Keep candidates separate from usable presets. A healthy homepage is not a working download.

Some requirements are already partially implemented in the backend; others still need implementation and client tests. This document does not claim complete enforcement.

## Expansion queue, not working presets

1. Dedicated public-domain ebook and audiobook presets using verified official APIs and lawful test files.
2. Authorized web fiction: investigate Royal Road and public unlocked chapters; check access terms and the client's chapter/EPUB capabilities.
3. Manga and comics: investigate MangaDex, WEBTOON and comic-strip feeds; confirm official endpoints, permitted access and chapter/image runtime support before building adapters.
4. Other Cinder source candidates such as Mayberry and Bookracy: provenance and resolver review first. Catalog inclusion is not an endorsement or evidence of safety.

Audio/Atmos coverage requires verified audio-format metadata. A title appearing in an Atmos catalog does not prove a download is Atmos. Z-Library authentication is not supplied by a public preset; credentials must never be placed in these files.

## Validation

Run `node --test *.test.mjs`. The catalog check detects preset-byte/version/routing drift and rejects stable entries without recorded per-app evidence. It does not execute native apps. The supplied GitHub Actions workflow schedules search/result-contract checks; see Actions for actual execution status. Automatic failover is not implemented.

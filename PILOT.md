# ShelfBridge pilot

Public configuration only. The service implementation belongs in the private shelfbridge-core repository. No credentials belong here.

Import URL: https://raw.githubusercontent.com/drewk312/shelfbridge-presets/main/direct-ebooks.json

This first preset is English-only direct ebooks, not torrents and not TorBox. It retains its existing provider ID to avoid an unnecessary identity change. It uses the existing VPS; GitHub serves only the JSON. No new paid service was added.

## Verified and remaining

Backend contract and download-slot tests passed. A real public-domain EPUB downloaded successfully. This release removes legacy notification calls and limits response mappings to the fields displayed as supported by the app.

Native app import, search, download, and refresh still need testing in each app: Lantern & Leaf, Ink & Echo, Bokumi, and the manga/comics app. Do not announce a general migration yet. This is not an Atmos, manga, comic, or audiobook preset. Availability is not guaranteed; external providers can fail or change.

## Release discipline

- Keep this URL stable; update its contents only after validation.
- Test changes with `node --test preset.test.mjs` and the private backend suite.
- Before promotion, test an import, English search, full lawful download, and refresh on every supported client.
- Use GitHub commit history to restore the prior JSON if a release regresses. A commit-pinned raw URL can be used for a fixed pilot version.
- Never auto-approve a replacement domain based only on search results or redirects. Review its provenance first.
- No scheduled health monitor has been installed yet. A successful test is not a permanent uptime guarantee.

Use sources only for content you are legally entitled to access.

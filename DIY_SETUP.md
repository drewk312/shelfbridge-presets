# Build your own Ink & Echo search stack (from nothing)

**Who this is for:** anyone starting with an empty machine, or an AI assistant given this file and told “follow it.”

**What you end up with (no Discord):**
1. A VPS that answers `POST https://YOUR-HOST/public/ebook/search` (and audiobook / all).
2. A GitHub repo of ShelfBridge preset JSON files.
3. Ink & Echo app importing those presets by raw GitHub URL.

**What this is not:** Discord bots, tickets, or chat panels. Skip anything named `inkbot`.

**Legal:** only search/download content you are allowed to access. Public-domain status varies by country.

---

## How to use this with an AI

Paste this whole file into Cursor / Claude / ChatGPT and say:

> Follow DIY_SETUP.md end to end. I have no server yet. Ask me only for: (1) VPS login, (2) DNS name I want, (3) GitHub username, (4) optional Mobilism username/password. Do not install Discord. Stop after Step 11 smoke test and show me the preset URLs to import.

Or follow the numbered steps yourself.

---

## Checklist (print this)

- [ ] Step 0 — Understand the pieces
- [ ] Step 1 — VPS + DNS
- [ ] Step 2 — Install Node, Caddy, Playwright deps
- [ ] Step 3 — Put scraper code on the server
- [ ] Step 4 — Env file (secrets)
- [ ] Step 5 — systemd services
- [ ] Step 6 — Caddy TLS reverse proxy
- [ ] Step 7 — Smoke test the API
- [ ] Step 8 — Fork presets + point ORIGIN at your host
- [ ] Step 9 — Import presets into Ink & Echo
- [ ] Step 10 — Optional sources (Anna’s, Mobilism)
- [ ] Step 11 — Drive-safe backup (no Discord)

---

## Step 0 — Understand the pieces

```
Phone / PC  →  Ink & Echo app
                 │
                 │ imports preset JSON (raw.githubusercontent.com/…)
                 ▼
            Preset says: POST https://search.YOURS.duckdns.org/public/ebook/search
                 │
                 ▼
            Your VPS (Caddy → Node scraper on 127.0.0.1:3000)
                 │
                 ├── zlib / LibGen / Anna’s / ABB / … scrapers
                 └── optional: annas-daemon on 127.0.0.1:8091 (Playwright)
```

You need **two** repos/folders:
| Piece | Where it lives | Purpose |
|-------|----------------|---------|
| Scraper (`inkecho`) | VPS `/opt/inkecho` | Does the searching |
| Presets (`shelfbridge-presets`) | GitHub | JSON the app imports; points at your scraper |

Starting points:
- Scraper code: unpack a Drive-safe `inkecho-drive-safe-nodiscord-*.tar.gz` **or** copy from someone who already runs this stack.
- Presets: https://github.com/drewk312/shelfbridge-presets (fork it).

---

## Step 1 — VPS + DNS

1. Rent a VPS (Ubuntu **24.04**). Prefer **2 GB+ RAM** if you run Anna’s Playwright daemon.
2. Open firewall ports **80** and **443**.
3. Create a free hostname (DuckDNS is fine), e.g. `search.yourname.duckdns.org`, pointing at the VPS public IP.
4. SSH in as root (or a sudo user).

```bash
hostnamectl   # confirm Ubuntu
curl -4 ifconfig.me   # confirm public IP matches DNS
```

---

## Step 2 — Install runtime

```bash
sudo apt update
sudo apt install -y curl git rsync caddy build-essential

# Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # should be v20+
```

Playwright browsers (needed for Anna’s daemon and Mobilism):

```bash
sudo npx --yes playwright install-deps
```

Create a dedicated user:

```bash
sudo useradd -r -s /usr/sbin/nologin -d /opt/inkecho inkecho || true
sudo mkdir -p /opt/inkecho /etc/inkecho /var/lib/inkecho /root/backups
```

---

## Step 3 — Deploy the scraper code

### Option A — From a Drive-safe backup tarball

On your PC, download `inkecho-drive-safe-nodiscord-*.tar.gz`, then:

```bash
# on the VPS after uploading the tar
cd /tmp
tar -xzf inkecho-drive-safe-nodiscord-*.tar.gz
# folder looks like inkecho-backup-YYYYMMDDTHHMMSSZ/
SRC=$(echo /tmp/inkecho-backup-*)
sudo rsync -a "$SRC/inkecho/" /opt/inkecho/
sudo chown -R inkecho:inkecho /opt/inkecho /var/lib/inkecho
```

### Option B — You already have `/opt/inkecho` sources

Copy `vps_scraper.js`, `annas-daemon.mjs`, `package.json`, and the other `.mjs` helpers into `/opt/inkecho`.

Then install deps:

```bash
cd /opt/inkecho
sudo -u inkecho npm install --omit=dev
# if package.json lists playwright as a dep/devDep:
sudo npx playwright install chromium
sudo chown -R inkecho:inkecho /opt/inkecho
```

Confirm the entrypoint exists:

```bash
test -f /opt/inkecho/vps_scraper.js && echo OK scraper
test -f /opt/inkecho/annas-daemon.mjs && echo OK annas
```

---

## Step 4 — Env file (secrets stay on the server)

Create `/etc/inkecho/inkecho.env`:

```bash
sudo tee /etc/inkecho/inkecho.env >/dev/null <<'EOF'
NODE_ENV=production
PORT=3000
BIND_HOST=127.0.0.1
SEARCH_DEADLINE_MS=10000
UV_THREADPOOL_SIZE=8
PUBLIC_SEARCH_RATE_LIMIT_PER_MINUTE=300
ANNAS_DAEMON_URL=http://127.0.0.1:8091

# Optional — leave blank / omit if unused
# MOBILISM_USER=
# MOBILISM_PASS=
# PROWLARR_ENABLED=0
# VPS_DISABLED_SOURCES=
EOF

sudo chmod 640 /etc/inkecho/inkecho.env
sudo chown root:inkecho /etc/inkecho/inkecho.env
```

Rules:
- Never put this file in GitHub or Google Drive without redacting passwords/tokens.
- Prefer this file over putting secrets in systemd `Environment=` lines.

---

## Step 5 — systemd services

### 5a — Main search API

`/etc/systemd/system/inkecho.service`:

```ini
[Unit]
Description=Ink & Echo private search supplement
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=inkecho
Group=inkecho
WorkingDirectory=/opt/inkecho
EnvironmentFile=/etc/inkecho/inkecho.env
ExecStart=/usr/bin/node /opt/inkecho/vps_scraper.js
Restart=always
RestartSec=5s
TimeoutStopSec=20s
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/inkecho
StateDirectory=inkecho
StateDirectoryMode=0700
LimitNOFILE=65535
MemoryMax=900M
TasksMax=256

[Install]
WantedBy=multi-user.target
```

Drop-in (optional but useful) `/etc/systemd/system/inkecho.service.d/env.conf`:

```ini
[Service]
EnvironmentFile=-/etc/inkecho/inkecho.env
```

### 5b — Anna’s Archive daemon (optional, recommended)

`/etc/systemd/system/annas-daemon.service`:

```ini
[Unit]
Description=Anna's Archive solver daemon (Playwright)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=/opt/inkecho
Environment=NODE_ENV=production
Environment=ANNAS_DAEMON_PORT=8091
Environment=ANNAS_MIRRORS=annas-archive.gl,annas-archive.pk,annas-archive.gd
ExecStart=/usr/bin/node /opt/inkecho/annas-daemon.mjs
Restart=always
RestartSec=5
LimitNOFILE=65535
MemoryMax=1300M

[Install]
WantedBy=multi-user.target
```

**Port must be 8091** (the scraper reads `ANNAS_DAEMON_URL=http://127.0.0.1:8091`).

Start them:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now inkecho
sudo systemctl enable --now annas-daemon   # if you installed it
sudo systemctl status inkecho --no-pager
```

---

## Step 6 — Caddy (HTTPS + reverse proxy)

Edit `/etc/caddy/Caddyfile` — replace the hostname with yours:

```caddy
search.yourname.duckdns.org {
  @private path /internal/*
  respond @private 404
  reverse_proxy 127.0.0.1:3000 {
    header_up X-Real-IP {remote_host}
  }
}
```

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Caddy gets a Let’s Encrypt cert automatically once DNS points at the VPS.

---

## Step 7 — Smoke test

On the VPS:

```bash
curl -sS -m 60 -X POST \
  'http://127.0.0.1:3000/public/ebook/search?debrid=direct&profile=best&client=ink-hosted&sources=zlib&lang=en' \
  -H 'Content-Type: application/json' \
  -d '{"title":"dune","author":"","limit":5,"contentType":"ebook"}'
```

Expect JSON with a non-empty `results` array.

From anywhere on the internet:

```bash
curl -sS -m 60 -X POST \
  'https://search.yourname.duckdns.org/public/ebook/search?debrid=direct&profile=best&client=ink-hosted&sources=zlib&lang=en' \
  -H 'Content-Type: application/json' \
  -d '{"title":"dune","author":"","limit":5,"contentType":"ebook"}'
```

If local works but public fails → DNS or Caddy. If both fail → `journalctl -u inkecho -n 80 --no-pager`.

Try more sources once zlib works: `sources=zlib,libgen,annas` (Anna’s needs the daemon).

---

## Step 8 — Your own presets repo

On your PC (or ask the AI):

1. Fork https://github.com/drewk312/shelfbridge-presets (or clone and create a new repo under your account).
2. Open `lib/preset.mjs` and change:

```js
const ORIGIN = 'https://search.yourname.duckdns.org';
const RAW_BASE = 'https://raw.githubusercontent.com/YOURUSER/shelfbridge-presets/main/';
```

3. Bump the version string in the build table / specs if the repo uses one.
4. Rebuild and test:

```bash
node build.mjs
node --test *.test.mjs
```

5. Commit and push to `main`.

Your import URLs become:

```
https://raw.githubusercontent.com/YOURUSER/shelfbridge-presets/main/all.json
https://raw.githubusercontent.com/YOURUSER/shelfbridge-presets/main/direct-ebooks.json
https://raw.githubusercontent.com/YOURUSER/shelfbridge-presets/main/ebooks-zlib.json
https://raw.githubusercontent.com/YOURUSER/shelfbridge-presets/main/ebooks-annas.json
https://raw.githubusercontent.com/YOURUSER/shelfbridge-presets/main/ebooks-libgen.json
https://raw.githubusercontent.com/YOURUSER/shelfbridge-presets/main/audiobooks.json
https://raw.githubusercontent.com/YOURUSER/shelfbridge-presets/main/mobilism.json
```

Do **not** hand-edit the generated `*.json` files — edit `sources.mjs` / `lib/preset.mjs` and re-run `node build.mjs`.

---

## Step 9 — Import into Ink & Echo

1. Install Ink & Echo: https://www.inkandecho.app/docs
2. Open **Settings → Sources** (or provider import).
3. Choose **Remote JSON URL**.
4. Paste one raw GitHub URL from Step 8 (start with `all.json` or `direct-ebooks.json`).
5. Validate → Add.
6. Search for a known title and confirm results appear.

Tips:
- Import **either** `all.json` **or** the smaller per-source presets — not both, or you duplicate every query.
- Presets call your VPS; if the phone is on cellular and the VPS is down, searches fail.

---

## Step 10 — Optional sources

### Anna’s Archive
- Requires `annas-daemon` on **8091** and `ANNAS_DAEMON_URL` in the env file.
- Preset: `ebooks-annas.json`.

### Mobilism
- Needs a real account. Put credentials only in `/etc/inkecho/inkecho.env`:

```bash
MOBILISM_USER=your_username
MOBILISM_PASS=your_password
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl restart inkecho
```

- Mobilism is slower; multi-source presets already stop early (`SEARCH_DEADLINE_MS≈10000`) so one slow source does not hang everything.
- Preset: `mobilism.json` (or include mobilism in a custom sources list).

### Speed while keeping all sources
- Keep `SEARCH_DEADLINE_MS=10000`.
- The scraper races sources and can return early when priority sources already have hits.
- For “fast only” presets, use fewer sources in the preset table and rebuild.

---

## Step 11 — Google Drive backup (no Discord)

Goal: a tarball you can restore later that contains **scraper + systemd + redacted env**, never a Discord bot.

On the VPS:

```bash
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
STAGE=/tmp/inkecho-backup-$STAMP
OUT=/root/backups
mkdir -p "$STAGE"/{inkecho,etc/inkecho,systemd,caddy,notes} "$OUT"

rsync -a \
  --exclude node_modules --exclude .cache --exclude '*.bin' \
  --exclude 'playwright*' --exclude '.mobcookies.json' \
  /opt/inkecho/ "$STAGE/inkecho/"

# redact secrets
cp /etc/inkecho/inkecho.env "$STAGE/etc/inkecho/inkecho.env.redacted"
sed -i -E 's/(PASS|TOKEN|SECRET|KEY|USER)=.*/\1=REDACTED/g' \
  "$STAGE/etc/inkecho/inkecho.env.redacted"

cp -a /etc/systemd/system/inkecho.service "$STAGE/systemd/" 2>/dev/null || true
cp -a /etc/systemd/system/inkecho.service.d "$STAGE/systemd/" 2>/dev/null || true
cp -a /etc/systemd/system/annas-daemon.service "$STAGE/systemd/" 2>/dev/null || true
cp -a /etc/systemd/system/annas-daemon.service.d "$STAGE/systemd/" 2>/dev/null || true
# scrub any leftover secrets in unit drop-ins
find "$STAGE/systemd" -type f -print0 | xargs -0 -r sed -i -E \
  's/(PASS|TOKEN|SECRET|KEY|USER)=.*/\1=REDACTED/g'

grep -A15 'search\.' /etc/caddy/Caddyfile > "$STAGE/caddy/search-host.snippet" || true

echo "no Discord / inkbot in this archive" > "$STAGE/notes/STATUS.txt"

tar -C /tmp -czf "$OUT/inkecho-drive-safe-nodiscord-$STAMP.tar.gz" "inkecho-backup-$STAMP"
ls -lh "$OUT/inkecho-drive-safe-nodiscord-$STAMP.tar.gz"
```

On a PC with [rclone](https://rclone.org/drive/):

```powershell
rclone authorize "drive"
rclone mkdir gdrive:InkEcho-Backups
rclone copy .\inkecho-drive-safe-nodiscord-*.tar.gz gdrive:InkEcho-Backups/ -P
rclone copy .\DIY_SETUP.md gdrive:InkEcho-Backups/ -P
rclone ls gdrive:InkEcho-Backups
```

**Never** upload folders named `inkbot`, Discord tokens, `.mobcookies.json`, or unredacted env files.

If an older Drive archive still contains Discord, delete it:

```powershell
rclone delete gdrive:InkEcho-Backups/inkecho-drive-safe-2026....tar.gz   # the non-nodiscord one
rclone ls gdrive:InkEcho-Backups
```

Keep only `*nodiscord*` tarballs + this `DIY_SETUP.md`.

---

## Troubleshooting

| Symptom | Check |
|---------|--------|
| Empty results | `journalctl -u inkecho -n 100`; try `sources=zlib` alone |
| Anna’s empty | `systemctl status annas-daemon`; curl `http://127.0.0.1:8091` |
| Mobilism empty | creds in env; login cookies; selectors may need updates |
| App import fails | raw GitHub URL must be public; JSON must be `kind: "search"` |
| HTTPS fails | DNS A record + `caddy reload`; wait for cert |
| Slow searches | lower sources in preset; keep deadline 10s; don’t wait on Mobilism alone |

---

## Security checklist

- [ ] No Discord bot installed for this stack
- [ ] Secrets only in `/etc/inkecho/inkecho.env` (mode 640)
- [ ] Drive/GitHub backups are redacted
- [ ] `/internal/*` blocked in Caddy
- [ ] Scraper binds `127.0.0.1` (not public `:3000`)
- [ ] Rotate any password that ever appeared in chat or a unit file

---

## Done when

1. `curl` to your public `/public/ebook/search` returns results.
2. Ink & Echo imports your raw preset URL and finds the same book.
3. Drive folder has only `*nodiscord*` backup + this guide.

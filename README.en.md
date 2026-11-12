<div align="center">

<img src="public/logo.webp" width="96" height="96" alt="GoodCook" />

# 🍳 GoodCook

**Eat together, grow together.**
**A heavily modified fork of [Gloridust/GanCook](https://github.com/Gloridust/GanCook) (MIT).**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

[中文](README.md) · English

</div>

---

## Table of contents

- [Changes vs upstream](#-changes-vs-upstream-gancook)
- [Deploy](#-deploy)
- [Common operations](#-common-operations)
- [Backup & restore](#-backup--restore)
- [Migrate from upstream GanCook](#-migrate-from-upstream-gancook)
- [Tech stack](#-tech-stack)
- [License](#-license)

## ✨ Changes vs upstream (GanCook)

- 🏷️ **Custom dish categories** — family-wide, filterable dish page, badges on cards
- 🌗 **Light / Dark theme** — three-state switch (light / dark / system), persisted per device
- 🎨 **Theme panel** — five palettes (Green / Celadon / Caramel / Slate / Date red) × four styles, all in one Theme dialog
- 🔎 **Recipe search** — search on Bing / Bilibili / RED straight from home
- 🎭 **Style skins** — Default / Clear glass / Panda / Pixel / Paper / Flat; a skin takes over colors, radius and shadows
- ⚡ **Flat skin** — no blur, no shadows, 1.5px outlines; noticeably smoother on low-end phones
- 🧱 **Adjustable tab bar opacity** — live slider in Me
- 🔠 **Three text sizes** — Small / Default / Large, scaling the whole UI consistently on phone and desktop
- 🗂️ **Batch management** — select dishes and move them into an existing or new category at once
- 🧊 **Frosted-glass UI** — soft gradient background + glassmorphism on all surfaces
- 💻 **Native desktop layout** — sidebar nav + full-width content, two-column card grids
- 📦 **Dish backup as zip** — dish JSON + all images; import accepts zip and JSON
- 🔍 **Two-way ordering filter** — filter the dish picker by category + tag together
- 🧂 **Pantry** — aromatics / spices / seasonings sections with effect, best pairings and what to avoid (51 common items preloaded)
- 📖 **Recipes** — your own recipes (ingredients + steps + time + difficulty), 10 popular dishes preloaded
- 📊 **Dish insights** — most ordered / not had lately (≥14 days) as rows on home, each with its reason, never-ordered count in the footer, rows configurable in Me (3/5/8)
- 🍽️ **Smarter ordering** — search dishes; "hot" and "not had lately" appear as thumbnail cards you can open and add directly
- 💾 **Daily automatic backups** — database + images + secrets, scheduled and rotated
- 🚫 Removed the contribution-wall module

## 🚀 Deploy

Open `http://<NAS>:3000` — the first registered user becomes admin.

### Docker Compose (recommended)

Images are built automatically via GitHub Actions on every push:

```bash
curl -O https://raw.githubusercontent.com/utopia123/GoodCook/main/docker-compose.yml
docker compose up -d
```

Or save this minimal `docker-compose.yml` manually:

```yaml
services:
  goodcook:
    image: ghcr.io/utopia123/goodcook:latest
    container_name: goodcook
    restart: unless-stopped
    ports:
      - '3000:3000'
    volumes:
      - ./data:/data
    environment:
      TZ: Asia/Shanghai
```

To enable in-app one-click updates, use this variant (mounts the Docker socket):

```yaml
services:
  goodcook:
    image: ghcr.io/utopia123/goodcook:latest
    container_name: goodcook
    restart: unless-stopped
    ports:
      - '3000:3000'
    volumes:
      - ./data:/data
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      TZ: Asia/Shanghai
```

<details>
<summary>📜 Fully commented docker-compose.yml</summary>

```yaml
services:
  goodcook:
    # Built automatically by GitHub Actions (updates on every push to main)
    image: ghcr.io/utopia123/goodcook:latest
    # To build from source: comment the image line above, uncomment below
    # build: .
    container_name: goodcook
    restart: unless-stopped
    ports:
      - '3000:3000'
    volumes:
      # Data directory (SQLite + uploads). Back up by copying ./data
      - ./data:/data
      # Docker socket: enables the in-app one-click update.
      # Remove this line if your host has no Docker daemon or you don't want it.
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      # All optional. Works out of the box; secrets are generated on first start.
      TZ: Asia/Shanghai
```

</details>

### docker run

```bash
docker run -d --name goodcook \
  -p 3000:3000 \
  -v ./data:/data \
  --restart unless-stopped \
  ghcr.io/utopia123/goodcook:latest
```

### Build from source

```bash
git clone https://github.com/utopia123/GoodCook.git
cd GoodCook
docker compose up -d --build
```

## 🧰 Common operations

```bash
docker compose pull && docker compose up -d   # upgrade to latest image
docker compose logs -f                        # view logs
```

Backup: copy the `./data` folder next to your compose file — that's the complete backup (database + all images).

## 💾 Backup & restore

**Automatic**: Me → Backups → Settings, configure:

- daily backup time (default `03:00`)
- copies to keep (default 5, range 1–30; oldest pruned)

Backups live in `data/backups/` as `goodcook-backup-YYYY-MM-DD_HHmm.zip`, containing:

- `app.db` (consistent SQLite snapshot, safe while the app is running)
- `uploads/` (all dish and avatar images)
- `auth.secret` / `cron.secret` (session and scheduler keys)
- `backup-info.json`

**Manual**: hit "Back up now" in the same panel.

**Restore**:

```bash
docker compose down
cp -r data data.bak-$(date +%F)                        # optional safety copy
cd data && unzip goodcook-backup-2026-11-05_0300.zip   # leave backups/ untouched
cd .. && docker compose up -d                          # migrations run automatically
```

## 🧭 Migrate from upstream GanCook

Point this fork at the same `data` directory — the schema migrates incrementally and everything (accounts, meals, images) is preserved.

## 🧱 Tech stack

- **Next.js 16** (App Router · Server Actions) + React 19 + TypeScript
- **SQLite** + Drizzle ORM (better-sqlite3)
- Auth: bcrypt + jose-signed JWT + httpOnly cookies
- Images: sharp → WebP on disk
- Scheduling: in-process node-cron
- Styling: TailwindCSS v4 + frosted-glass design system + Framer Motion

## 📄 License

[MIT](LICENSE) · Upstream project: [Gloridust/GanCook](https://github.com/Gloridust/GanCook) · Made with ❤️

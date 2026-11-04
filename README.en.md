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
- [Migrate from upstream GanCook](#-migrate-from-upstream-gancook)
- [Development](#️-development)
- [Tech stack](#-tech-stack)
- [License](#-license)

## ✨ Changes vs upstream (GanCook)

- 🏷️ **Custom dish categories** — family-wide, filterable dish page, badges on cards
- 🌗 **Light / Dark theme** — three-state switch (light / dark / system), persisted per device
- 🧊 **Frosted-glass UI** — soft gradient background + glassmorphism on all surfaces
- 💻 **Native desktop layout** — sidebar nav + full-width content, two-column card grids
- 📦 **Dish backup as zip** — dish JSON + all images; import accepts zip and JSON
- 🔍 **Tag filter when ordering** — filter the dish picker by dish tags
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

<details>
<summary>📜 Fully commented docker-compose.yml (incl. docker.sock one-click update)</summary>

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

### ⚠️ Two one-time steps before first deploy

1. Enable workflows on the repo's `Actions` tab (disabled by default on forks), then trigger **Run workflow** or push once
2. After the first successful build, set the package to **Public** under `Packages` settings so NAS devices can pull anonymously

## 🧰 Common operations

```bash
docker compose pull && docker compose up -d   # upgrade to latest image
docker compose logs -f                        # view logs
```

Backup: copy the `./data` folder next to your compose file — that's the complete backup (database + all images).

## 🧭 Migrate from upstream GanCook

Point this fork at the same `data` directory — the schema migrates incrementally and everything (accounts, meals, images) is preserved.

## 🛠️ Development

```bash
npm install
cp .env.example .env.local
npm run db:migrate
npm run dev   # http://localhost:3000
```

## 🧱 Tech stack

- **Next.js 16** (App Router · Server Actions) + React 19 + TypeScript
- **SQLite** + Drizzle ORM (better-sqlite3)
- Auth: bcrypt + jose-signed JWT + httpOnly cookies
- Images: sharp → WebP on disk
- Scheduling: in-process node-cron
- Styling: TailwindCSS v4 + frosted-glass design system + Framer Motion

## 📄 License

[MIT](LICENSE) · Upstream project: [Gloridust/GanCook](https://github.com/Gloridust/GanCook) · Made with ❤️

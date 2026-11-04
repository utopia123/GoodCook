<div align="center">

<img src="public/logo.webp" width="96" height="96" alt="GoodCook" />

# 🍳 GoodCook

**A self-hostable personal cooking system for your NAS.**
**A heavily modified fork of [Gloridust/GanCook](https://github.com/Gloridust/GanCook) (MIT).**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

[中文](README.md) · English

</div>

---

## ✨ Changes vs upstream (GanCook)

- 🏷️ **Custom dish categories** — family-wide categories (add/rename/delete), filterable dish page, category badges on cards
- 🌗 **Light / Dark theme** — three-state switch (light / dark / system), no flash on load, persisted per device
- 🧊 **Frosted-glass UI** — soft gradient page background + glassmorphism across all surfaces
- 💻 **Native desktop layout** — sidebar navigation + left-aligned full-width content, two-column card grids; mobile keeps the floating bottom tab bar
- 📦 **Dish backup as zip** — one-click export of dish JSON + all images; import accepts both zip and JSON (skips duplicates, auto-creates categories)
- 🔍 **Tag filter when ordering** — filter the dish picker by dish tags
- 🚫 Removed the contribution-wall (heatmap) module

## 🚀 Quick start

### Docker Compose (recommended)

Images are built automatically via GitHub Actions on every push:

```bash
curl -O https://raw.githubusercontent.com/utopia123/GoodCook/main/docker-compose.yml
docker compose up -d
```

### docker run

```bash
docker run -d --name goodcook \
  -p 3000:3000 \
  -v ./data:/data \
  --restart unless-stopped \
  ghcr.io/utopia123/goodcook:latest
```

> ⚠️ GHCR packages are **private** by default: after the first build, go to the repo's `Packages` settings and set the package to **Public** so NAS devices can pull anonymously.

### Build from source

```bash
git clone https://github.com/utopia123/GoodCook.git
cd GoodCook
docker compose up -d --build
```

Open `http://<NAS>:3000` — the first registered user becomes admin. All state lives in the mounted `data` directory (SQLite + images); copy it to back up or migrate.

**Migrating from upstream GanCook**: point this fork at the same `data` directory — the schema migrates incrementally and everything (accounts, meals, images) is preserved.

## 🛠️ Development

```bash
npm install
cp .env.example .env.local
npm run db:migrate
npm run dev   # http://localhost:3000
```

## 📄 License

[MIT](LICENSE) · Upstream project: [Gloridust/GanCook](https://github.com/Gloridust/GanCook) · Made with ❤️ for family dinners

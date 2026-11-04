<div align="center">

<img src="public/logo.webp" width="96" height="96" alt="GoodCook" />

# 🍳 GoodCook

**自部署到 NAS 的家庭点菜系统 —— 一家人轮流做饭、点菜、互相打分。**
**基于 [Gloridust/GanCook](https://github.com/Gloridust/GanCook)（MIT）深度改造的分支。**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

中文 · [English](README.en.md)

</div>

---

## ✨ 与原版（GanCook）的主要差异

- 🏷️ **菜品自定义分类** —— 全家共用一套分类（增/改名/删除），菜品页按分类过滤，卡片显示分类角标
- 🌗 **明暗主题** —— 浅色 / 深色 / 跟随系统三态切换，防闪烁，选择存本机
- 🧊 **磨砂玻璃 UI** —— 页面渐变底 + 全站半透明毛玻璃质感（"牛奶布艺"升级版）
- 💻 **电脑端原生布局** —— 左侧导航栏 + 内容左对齐铺满，列表双列卡片网格；手机端保持底部悬浮导航不变
- 📦 **菜品 zip 备份** —— 一键导出「菜品 JSON + 全部图片」，导入兼容 zip 与 JSON（同名跳过、分类幂等补建）
- 🔍 **点菜标签筛选** —— 点菜时按菜品标签一键过滤
- 🚫 移除贡献墙（热力图）模块

## 🚀 快速开始

### 方式一：Docker Compose（推荐）

镜像由 GitHub Actions 自动构建（每次推送自动更新），无需本地构建：

```bash
curl -O https://raw.githubusercontent.com/utopia123/GoodCook/main/docker-compose.yml
docker compose up -d
```

### 方式二：docker run

```bash
docker run -d --name goodcook \
  -p 3000:3000 \
  -v ./data:/data \
  --restart unless-stopped \
  ghcr.io/utopia123/goodcook:latest
```

> ⚠️ 首次构建镜像后，GHCR 包默认是**私有**的：到仓库的 `Packages` 页 → 进入包设置 → 改为 **Public**，NAS 才能匿名拉取。

### 方式三：源码构建

```bash
git clone https://github.com/utopia123/GoodCook.git
cd GoodCook
docker compose up -d --build   # compose 里注释 image、启用 build 即可
```

打开 `http://<NAS地址>:3000`，第一个注册的人即成为管理员。数据全部落在 `data` 目录（SQLite + 图片），备份/迁移只需复制该目录。

**从原版 GanCook 迁移**：把原版挂载的 `data` 目录整体复制给本版本使用即可——数据库结构纯增量迁移，账号、饭局、图片全部保留。

## 🛠️ 本地开发

```bash
npm install
cp .env.example .env.local
npm run db:migrate
npm run dev   # http://localhost:3000
```

## 🧱 技术栈

- **Next.js 16**（App Router · Server Actions）+ React 19 + TypeScript
- **SQLite** + Drizzle ORM（better-sqlite3）
- 鉴权：bcrypt + jose 签名 JWT + httpOnly Cookie
- 图片：sharp 压缩转 WebP 落盘
- 调度：进程内 node-cron
- 样式：TailwindCSS v4 + 磨砂玻璃设计系统 + Framer Motion

## 📄 License

[MIT](LICENSE) · 原项目 [Gloridust/GanCook](https://github.com/Gloridust/GanCook) · 感谢原作者 ❤️

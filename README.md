<div align="center">

<img src="public/logo.webp" width="96" height="96" alt="GoodCook" />

# 🍳 GoodCook

**一起吃饭，一起成长。**
**基于 [Gloridust/GanCook](https://github.com/Gloridust/GanCook)（MIT）深度改造。**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

中文 · [English](README.en.md)

</div>

---

## 目录

- [与原版的主要差异](#-与原版gancook的主要差异)
- [部署](#-部署)
  - [Docker Compose（推荐）](#docker-compose推荐)
  - [docker run](#docker-run)
  - [源码构建](#源码构建)
- [常用运维](#-常用运维)
- [数据备份与还原](#-数据备份与还原)
- [从原版 GanCook 迁移](#-从原版-gancook-迁移)
- [技术栈](#-技术栈)
- [License](#-license)

## ✨ 与原版（GanCook）的主要差异

- 🏷️ **菜品自定义分类** —— 全家共用一套分类（增/改名/删除），菜品页按分类过滤，卡片显示分类角标，支持批量归类
- 🌗 **明暗主题** —— 浅色 / 深色 / 跟随系统三态切换，防闪烁，选择存本机
- 🎨 **主题面板** —— 五套配色（青菜绿 / 青瓷 / 焦糖 / 雾岩 / 枣红）× 五种风格皮肤，统一在「主题」里选择
- 🔎 **菜谱搜索** —— 首页输入关键词，一键在 Bing / B站 / 小红书 搜索菜谱做法
- 🎭 **风格皮肤** —— 默认 / 清玻璃 / 黑白团子 / 像素冒险 / 纸质手账 / 极简，会同时接管配色、圆角与阴影
- ⚡ **极简皮肤** —— 关闭全站模糊与投影、改 1.5px 描边，低端机上明显更顺
- 🧱 **Tab 栏透明度可调** —— 我的页滑块实时调整底部导航的通透度
- 🔠 **字号三档** —— 小 / 标准 / 大，整页等比缩放，手机与电脑表现一致
- 🗂️ **批量管理** —— 菜品页勾选多道菜，一次性移入已有分类或新建分类
- 🧊 **磨砂玻璃 UI** —— 页面渐变底 + 半透明毛玻璃质感；页面切换与列表入场为轻量 CSS 动画，并遵循系统「减少动效」设置
- 💻 **电脑端原生布局** —— 左侧导航栏 + 内容左对齐铺满，列表双列卡片网格；手机端保持底部悬浮导航
- 📦 **菜品 zip 备份** —— 一键导出「菜品 JSON + 全部图片」，导入兼容 zip 与 JSON
- 🔍 **点菜双筛选** —— 点菜时可按分类 + 标签叠加过滤
- 🧂 **佐料区** —— 佐料 / 香料 / 调味料三分区，记录功效、适合配什么菜、什么菜不适合放（预置 51 条常用）
- 📖 **菜谱区** —— 自定义菜谱（食材 + 步骤 + 用时 + 难度），内置 10 道家常热门菜
- 📊 **菜品热度洞察** —— 首页行式展示最常点 / 好久没吃（≥14 天），每行带原因，底部提示从没点过的数量，条数可在「我的」页设置（3/5/8）
- 🍽️ **点菜页智能推荐** —— 搜索菜品；「常点 / 久未吃」以缩略图横向卡片呈现，点开即可看图并直接加入这一顿
- 💾 **每日自动备份** —— 数据库 + 图片 + 密钥打包，按设定时间自动执行、滚动保留
- 🚫 移除贡献墙（热力图）模块

## 🚀 部署

打开 `http://<NAS地址>:3000`，第一个注册的人即成为管理员。

### Docker Compose（推荐）

镜像由 GitHub Actions 自动构建（每次推送自动更新），无需本地构建：

```bash
curl -O https://raw.githubusercontent.com/utopia123/GoodCook/main/docker-compose.yml
docker compose up -d
```

或手动保存下面这份精简版为 `docker-compose.yml`：

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

需要应用内「关于与更新」的一键升级功能时，用下面这份（多挂载一行 Docker 套接字）：

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
<summary>📜 带完整注释的 docker-compose.yml</summary>

```yaml
services:
  goodcook:
    # GoodCook 镜像：由 GitHub Actions 自动构建（每次推送 main 自动更新）
    image: ghcr.io/utopia123/goodcook:latest
    # 源码自行构建：注释上面 image 一行，取消下一行注释
    # build: .
    container_name: goodcook
    restart: unless-stopped
    ports:
      - '3000:3000'
    volumes:
      # 数据目录（SQLite + 上传图片）。备份只需复制 ./data
      - ./data:/data
      # Docker 套接字：启用「家庭管理 → 关于与更新」的网页端一键更新。
      # 若你的环境没有 Docker 守护进程或不想要此功能，删掉这行即可。
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      # 全部可选。开箱即用，无需配置任何密钥（首次启动自动生成并持久化到 ./data）。
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

### 源码构建

```bash
git clone https://github.com/utopia123/GoodCook.git
cd GoodCook
docker compose up -d --build
```

## 🧰 常用运维

```bash
docker compose pull && docker compose up -d   # 升级到最新镜像
docker compose logs -f                        # 查看日志
```

备份：直接复制 compose 目录下的 `./data` 文件夹，即为完整备份（数据库 + 全部图片）。

## 💾 数据备份与还原

**自动备份**：「我的」页 → 数据备份 → 设置，可配置：

- 每日备份时间（默认 `03:00`，避开使用时段）
- 保留份数（默认 5，可设 1–30，超出自动删除最旧的）

备份存放在 `data/backups/`，文件名形如 `goodcook-backup-2026-11-05_0300.zip`，内容为：

- `app.db`（SQLite 一致性快照，备份时正在使用也不会损坏）
- `uploads/`（全部菜品图片与头像）
- `auth.secret` / `cron.secret`（会话与调度密钥，保留登录态）
- `backup-info.json`（版本与时间信息）

**手动备份**：同一面板点「立即备份」。

**还原步骤**：

```bash
docker compose down                    # 停止容器
cp -r data data.bak-$(date +%F)        # 先留一份现状（可选）
cd data && unzip goodcook-backup-2026-11-05_0300.zip   # 覆盖数据（backups/ 目录不动）
cd .. && docker compose up -d          # 启动，自动执行迁移
```

> 备份文件在 `data/backups/` 内，解压时注意不要覆盖 `backups/` 自身，留着它们作为历史快照。

## 🧭 从原版 GanCook 迁移

把原版挂载的 `data` 目录整体复制给本版本使用即可——数据库结构纯增量迁移，账号、饭局、图片全部保留。

## 🧱 技术栈

- **Next.js 16**（App Router · Server Actions）+ React 19 + TypeScript
- **SQLite** + Drizzle ORM（better-sqlite3）
- 鉴权：bcrypt + jose 签名 JWT + httpOnly Cookie
- 图片：sharp 压缩转 WebP 落盘
- 调度：进程内 node-cron
- 样式：TailwindCSS v4 + 磨砂玻璃设计系统 + Framer Motion

## 📄 License

[MIT](LICENSE) · 原项目 [Gloridust/GanCook](https://github.com/Gloridust/GanCook) · 感谢原作者 ❤️

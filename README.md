# Agnes Studio

<div align="center">

**基于 Agnes AI 多模态模型的图像与视频生成平台**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

🌐 [在线体验](https://cloudflare-workers-autoconfig-agnes-studio.heziliang.workers.dev) · 📖 [Agnes AI 文档](https://agnes-ai.com)

</div>

## 📋 项目简介

Agnes Studio 是一个开箱即用的 AI 创意内容生成平台，集成了 **图像生成** 和 **视频生成** 两大核心能力。基于 [Agnes AI](https://agnes-ai.com) 多模态模型，支持文生图、图生图、文生视频、图生视频、多图视频和关键帧动画。

### ✨ 核心特性

| 模块 | 功能 |
|------|------|
| 🎨 **图像生成** | 支持 AgnesAI Image 2.0 Flash / 2.1 Flash 两款模型，多种画幅比例，实时预览 |
| 🎬 **视频生成** | 文生视频、图生视频、多图视频、关键帧动画，异步任务轮询 |
| 💾 **持久化历史** | IndexedDB 本地存储，刷新不丢失，缩略图网格浏览 |
| 🖼️ **多图上传** | 支持最多 10 张参考图片，用于多图视频和关键帧动画 |
| 🎯 **分辨率自适应** | 768p / 1152p 两档分辨率，自动匹配最大帧数限制 |
| 🌙 **深色主题** | 全页面暗色毛玻璃 UI，响应式布局 |

## 🏗️ 技术栈

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 16)                 │
│  React 19 · TypeScript 5.9 · Tailwind CSS 4 · App Router │
├─────────────────────────────────────────────────────────┤
│                   State & Storage                        │
│  React Hooks · IndexedDB (localStorage fallback)         │
├─────────────────────────────────────────────────────────┤
│                   API Routes (Serverless)                │
│  Next.js Route Handlers → Agnes AI Gateway               │
├─────────────────────────────────────────────────────────┤
│                   External Services                      │
│  Agnes AI: Image 2.0/2.1 Flash · Video V2.0              │
└─────────────────────────────────────────────────────────┘
```

## 🚀 快速开始

### 前置条件

- **Node.js** ≥ 18
- **npm** / yarn / pnpm
- **Agnes AI API Key**（[免费注册获取](https://agnes-ai.com)）

### 安装与运行

```bash
# 1. 克隆项目
git clone https://github.com/heziliang369/agnes-studio.git
cd agnes-studio

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入你的 API Key
# AGNES_API_KEY=sk-your-key-here

# 4. 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 即可使用。

### 构建生产版本

```bash
npm run build
npm start
```

## 📁 项目结构

```
agnes-studio/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # 根布局（字体、元信息）
│   │   ├── page.tsx                  # 主页（Tab 导航 + 组件挂载）
│   │   ├── globals.css               # 全局样式（Tailwind + 深色主题）
│   │   └── api/                      # API 路由（Serverless Functions）
│   │       ├── images/
│   │       │   └── generate/
│   │       │       └── route.ts      # 图像生成接口
│   │       └── videos/
│   │           ├── generate/
│   │           │   └── route.ts      # 视频生成接口
│   │           └── status/
│   │               └── route.ts      # 视频状态轮询接口
│   ├── components/
│   │   ├── ImageGenerator.tsx        # 图像生成器（模型选择、画幅、历史记录）
│   │   ├── VideoGenerator.tsx        # 视频生成器（多图/关键帧、进度条）
│   │   └── HistoryPanel.tsx          # 历史记录弹窗（缩略图、删除）
│   └── lib/
│       ├── constants.ts              # 常量配置（模型、分辨率、时长）
│       ├── agnes-api.ts              # Agnes AI API 客户端（HTTPS 调用）
│       └── db.ts                     # IndexedDB 持久化存储
├── .env.example                      # 环境变量模板
├── .env.local                        # 本地环境变量（不提交 Git）
├── .gitignore
├── next.config.ts                    # Next.js 配置
├── tailwind.config.ts                # Tailwind CSS 配置
├── tsconfig.json                     # TypeScript 配置
└── package.json
```

## 🔌 API 文档

### 图像生成

**端点**: `POST /api/images/generate`

**请求体**:

```json
{
  "prompt": "一只可爱的猫咪坐在窗台上晒太阳",
  "model": "agnes-image-2.0-flash",
  "aspectRatio": "landscape"
}
```

**响应**:

```json
{
  "success": true,
  "images": [{ "url": "https://..." }],
  "model": "agnes-image-2.0-flash",
  "size": "1024x768"
}
```

### 视频生成

**端点**: `POST /api/videos/generate`

**请求体**:

```json
{
  "prompt": "海浪轻拍沙滩，夕阳西下",
  "width": 1152,
  "height": 768,
  "numFrames": 121,
  "frameRate": 24,
  "negativePrompt": "低质量、模糊",
  "image": "data:image/png;base64,...",
  "extraBody": {
    "image": ["data:image/png;base64,...", "data:image/png;base64,..."],
    "mode": "keyframes"
  }
}
```

**响应**:

```json
{
  "success": true,
  "taskId": "task_xxx",
  "videoId": "video_xxx"
}
```

### 视频状态轮询

**端点**: `POST /api/videos/status`

**请求体**:

```json
{
  "videoId": "video_xxx"
}
```

**响应**:

```json
{
  "success": true,
  "status": "generating",
  "progress": 45,
  "data": {
    "url": "https://...",
    "size": "1280x768",
    "seconds": "5.0"
  }
}
```

## 📊 支持的模型

### 图像模型

| 模型 | 速度 | 特点 |
|------|------|------|
| `agnes-image-2.0-flash` | ~5 秒 | 快速通用，适合日常创作 |
| `agnes-image-2.1-flash` | ~8 秒 | 更高保真度，适合精细创作 |

### 视频模型

| 模型 | 能力 | 最大时长 |
|------|------|----------|
| `agnes-video-v2.0` | 文生视频、图生视频、多图视频、关键帧动画 | 约 7 秒（169 帧） |

### 视频分辨率与帧数限制

| 分辨率 | 尺寸 | 最大帧数 | 最大时长 (~24fps) |
|--------|------|----------|-------------------|
| 768p (推荐) | 1152×768 | 409 | ~17 秒 |
| 1152p | 1728×1152 | 169 | ~7 秒 |

## 🖥️ 部署指南

### Vercel（推荐）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/heziliang369/agnes-studio)

1. 点击上方按钮或执行：

```bash
npm i -g vercel
vercel
```

2. 在 Vercel 控制面板中添加环境变量：
   - `AGNES_API_KEY` → 你的 Agnes AI API Key

### Docker

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t agnes-studio .
docker run -p 3000:3000 \
  -e AGNES_API_KEY=sk-your-key-here \
  agnes-studio
```

### Cloudflare Pages

1. 连接 GitHub 仓库至 Cloudflare Pages
2. 添加环境变量 `AGNES_API_KEY`
3. 框架预设选择 **Next.js**，构建命令 `npm run build`

### 传统 Node.js 服务器

```bash
npm run build
AGNES_API_KEY=sk-your-key-here npm start
```

## 🔒 安全说明

- **API Key 保护**：密钥仅存储在服务器端环境变量中，不暴露给前端
- **Git 安全**：`.env.local` 已在 `.gitignore` 中，不会被提交
- **HTTPS**：生产环境务必启用 HTTPS
- **速率限制**：建议在生产环境添加 API 速率限制中间件

## 🧪 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器（热重载）
npm run dev

# 类型检查
npx tsc --noEmit

# ESLint 检查
npm run lint
```

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源。

## 🙏 致谢

- [Agnes AI](https://agnes-ai.com) — 提供图像与视频生成 API
- [Next.js](https://nextjs.org/) — React 全栈框架
- [Tailwind CSS](https://tailwindcss.com/) — 原子化 CSS 框架
- [React](https://react.dev/) — 前端 UI 库

---

<div align="center">

**Made with ❤️ by the Agnes Studio Team**

⭐ Star this repo if you find it helpful!

</div>

# Agnes AI 创意工坊 — 部署说明

## 快速开始

### 1. 安装依赖

```bash
cd /Users/aaron/work/website/agnes-studio
npm install
```

### 2. 配置环境变量

```bash
# 复制示例文件
cp .env.example .env.local

# 编辑 .env.local，填入你的 Agnes AI API Key
# AGNES_API_KEY=sk-xxxxx
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3001

### 4. 构建生产版本

```bash
npm run build
npm start
```

## 项目结构

```
agnes-studio/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # 根布局
│   │   ├── page.tsx            # 主页（Tab 导航）
│   │   ├── globals.css         # 全局样式
│   │   └── api/
│   │       ├── images/
│   │       │   └── generate/
│   │       │       └── route.ts    # 图像生成 API
│   │       └── videos/
│   │           ├── generate/
│   │           │   └── route.ts    # 视频生成 API
│   │           └── status/
│   │               └── route.ts    # 视频状态轮询 API
│   ├── components/
│   │   ├── ImageGenerator.tsx    # 图像生成组件
│   │   ├── VideoGenerator.tsx    # 视频生成组件
│   │   └── HistoryPanel.tsx      # 历史记录弹窗
│   └── lib/
│       ├── constants.ts          # 常量配置
│       └── agnes-api.ts          # Agnes AI API 客户端
├── .env.example                  # 环境变量模板
├── .env.local                    # 本地环境变量（不提交 Git）
├── package.json
└── tsconfig.json
```

## API 集成说明

### 图像生成

- **端点**: `POST /api/images/generate`
- **请求体**:
  ```json
  {
    "prompt": "一只可爱的猫咪",
    "model": "agnes-image-2.0-flash",
    "aspectRatio": "landscape"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "images": [{"url": "https://..."}],
    "model": "agnes-image-2.0-flash",
    "size": "1024x768"
  }
  ```

### 视频生成

- **端点**: `POST /api/videos/generate`
- **请求体**:
  ```json
  {
    "prompt": "海浪拍打着沙滩",
    "width": 1152,
    "height": 768,
    "numFrames": 121,
    "frameRate": 24
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "taskId": "...",
    "videoId": "..."
  }
  ```

### 视频状态轮询

- **端点**: `POST /api/videos/status`
- **请求体**:
  ```json
  {
    "videoId": "xxx"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "status": "generating|completed|failed",
    "progress": 45
  }
  ```

## 生产部署

### Vercel 部署（推荐）

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录并部署
vercel login
vercel --prod
```

设置环境变量：
```bash
vercel env add AGNES_API_KEY production
# 输入你的 API Key
```

### Docker 部署

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
  -e AGNES_API_KEY=sk-xxxxx \
  agnes-studio
```

### 传统 Node.js 服务器

```bash
npm run build
# 确保 .env.local 中有 AGNES_API_KEY
AGNES_API_KEY=sk-xxxxx npm start
```

## 安全注意事项

1. **API Key 安全**：Key 仅存储在服务器端 `.env.local` 中，不暴露给前端
2. **Git 忽略**：`.env.local` 已在 `.gitignore` 中，不会被提交
3. **HTTPS**：生产环境务必使用 HTTPS
4. **速率限制**：建议在生产环境添加 API 速率限制

## 故障排查

| 问题 | 解决方案 |
|------|----------|
| 图像生成返回空结果 | 检查 `.env.local` 中的 API Key 是否正确 |
| 视频生成超时 | 默认超时 300s，可在 `lib/agnes-api.ts` 中调整 |
| 页面 404 | 确认端口配置正确（开发服务器默认 3000） |
| TypeScript 错误 | 运行 `npm install` 确保所有依赖已安装 |

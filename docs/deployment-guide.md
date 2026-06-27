# 快速部署手册

本文档提供 UniPortal 项目的快速部署指南，包括本地开发、GitHub Pages 部署和 Nginx 部署。

## 📋 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Git（用于 GitHub Pages 部署）

## 🔧 本地开发

### 1. 安装依赖

```bash
pnpm install
```

### 2. 启动开发服务器

```bash
# 并行启动所有应用
pnpm dev

# 或单独启动
pnpm dev:auth
pnpm dev:app-a
pnpm dev:app-b
```

### 3. 开发环境访问地址

| 应用 | 地址 | 端口 |
|------|------|------|
| 认证中心 | http://127.0.0.1:3001/auth/ | 3001 |
| 业务应用 A | http://127.0.0.1:3002/app-a/ | 3002 |
| 业务应用 B | http://127.0.0.1:3003/app-b/ | 3003 |

## 🚀 GitHub Pages 部署

### 前置准备

1. 在 GitHub 创建仓库（如 `UniPortal`）
2. 配置仓库的 GitHub Pages 功能：
   - Settings → Pages → Source: GitHub Actions

### 方式一：自动部署（推荐）

项目已配置 GitHub Actions 工作流，推送代码后自动部署：

```bash
git add -A
git commit -m "feat: 添加新功能"
git push origin main
```

工作流文件：`.github/workflows/deploy.yml`

### 方式二：手动部署

```bash
# 子路径部署（如 https://username.github.io/UniPortal/）
REPO_NAME=UniPortal pnpm deploy

# 根路径部署（如 https://your-domain.com/）
pnpm deploy
```

### 自定义域名配置

1. 修改 `.github/workflows/deploy.yml`：

```yaml
env:
  REPO_NAME: ${{ github.event.repository.name }}
  CUSTOM_DOMAIN: your-domain.com
```

2. 在域名服务商配置 DNS 记录：

| 类型 | 主机记录 | 记录值 |
|------|----------|--------|
| CNAME | @ | username.github.io |
| CNAME | www | username.github.io |

### 部署路径结构

```
dist/
├── auth/              # 认证中心
│   ├── index.html
│   └── assets/
├── app-a/             # 业务应用 A
│   ├── index.html
│   └── assets/
├── app-b/             # 业务应用 B
│   ├── index.html
│   └── assets/
├── 404.html           # SPA 路由重定向页面
├── index.html         # 根路径重定向到认证中心
└── CNAME              # 自定义域名配置（可选）
```

### SPA History 模式原理

GitHub Pages 不支持 SPA history 模式，项目通过以下机制解决：

1. **根目录 404.html**：捕获所有路由 404 请求
2. **sessionStorage 存储**：保存原始请求 URL
3. **应用内重定向**：应用加载后读取 sessionStorage 并导航到目标路由

## 📦 Nginx 部署

### 服务器准备

1. 安装 Nginx
2. 将 `dist/` 目录复制到服务器（如 `/var/www/html/`）

### Nginx 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 根路径重定向到认证中心
    location = / {
        return 302 /auth/;
    }

    # 认证中心
    location /auth/ {
        alias /var/www/html/auth/;
        try_files $uri $uri/ /auth/index.html;
    }

    # 业务应用 A
    location /app-a/ {
        alias /var/www/html/app-a/;
        try_files $uri $uri/ /app-a/index.html;
    }

    # 业务应用 B
    location /app-b/ {
        alias /var/www/html/app-b/;
        try_files $uri $uri/ /app-b/index.html;
    }

    # API 代理（如有后端）
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 配置 HTTPS（推荐）

使用 Let's Encrypt 免费证书：

```bash
# 安装 certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

## ⚙️ 环境变量

### 部署时环境变量

| 变量 | 说明 | 必填 | 示例 |
|------|------|------|------|
| `REPO_NAME` | GitHub 仓库名，用于子路径部署 | 否 | `UniPortal` |
| `CUSTOM_DOMAIN` | 自定义域名 | 否 | `your-domain.com` |

### 应用环境变量（.env）

| 变量 | 说明 | 示例 |
|------|------|------|
| `VITE_API_URL` | API 基础地址 | `/api` |
| `VITE_AUTH_URL` | 认证中心登录页 | `/auth/login` |
| `VITE_BASE_PATH` | 应用基础路径 | `/auth/` |
| `VITE_REPO_NAME` | 仓库名（部署脚本自动注入） | `UniPortal` |

## 🔍 部署验证

### 检查部署结果

1. 访问根路径：`https://your-domain.com/` → 应重定向到 `/auth/`
2. 访问认证中心：`https://your-domain.com/auth/` → 显示登录页或首页
3. 访问业务应用：`https://your-domain.com/app-a/` → 显示应用内容
4. 测试子路由：`https://your-domain.com/auth/login?return_to=/` → 应正常加载

### 常见问题

**Q: 访问子路由（如 `/auth/login`）返回 404？**

A: 确保根目录 `404.html` 已正确生成并部署。GitHub Pages 需要几分钟生效。

**Q: 登录后 URL 和页面不同步？**

A: 确保所有路由跳转使用 `router.replace` 而非 `router.push`。

**Q: 子系统链接跳转路径错误？**

A: 使用 `buildAppPath` 工具函数构建路径，确保包含 `REPO_NAME` 前缀。

## 📝 部署脚本说明

部署脚本 `scripts/deploy.js` 执行以下步骤：

1. **清理 dist 目录**：删除旧的构建产物
2. **构建应用**：分别构建 auth-app、business-app-a、business-app-b
3. **复制文件**：将构建产物复制到 `dist/[app]/`
4. **生成重定向页面**：根目录 `index.html` 重定向到认证中心
5. **生成 404 页面**：支持 SPA history 模式的路由重定向
6. **生成 CNAME**（可选）：自定义域名配置

## 🗂️ 目录结构

```
scripts/
├── deploy.js              # 一键部署脚本
└── nginx.conf.example     # Nginx 配置示例
```

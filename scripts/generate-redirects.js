import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const REPO_NAME = process.env.REPO_NAME || '';
const DEPLOY_TARGET = process.env.DEPLOY_TARGET || path.join(rootDir, 'dist');

const REDIRECTS = [
  { from: '', to: '/UniPortal/auth/' },
  { from: 'app-a', to: '/UniPortal/app-a/' },
  { from: 'app-b', to: '/UniPortal/app-b/' },
];

function generateRedirectHtml(targetUrl) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>UniPortal - 统一门户</title>
  <meta http-equiv="refresh" content="0; url=${targetUrl}" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    }
    .container {
      text-align: center;
      color: white;
      padding: 40px;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    }
    .logo { font-size: 48px; margin-bottom: 20px; }
    .title { font-size: 28px; font-weight: 600; margin-bottom: 10px; }
    .subtitle { font-size: 14px; opacity: 0.8; margin-bottom: 30px; }
    .spinner {
      width: 40px; height: 40px;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .link { color: white; text-decoration: underline; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🚀</div>
    <div class="title">UniPortal</div>
    <div class="subtitle">统一门户系统</div>
    <div class="spinner"></div>
    <div>正在跳转到主门户...</div>
    <div style="margin-top: 10px;">
      如果没有自动跳转，请点击 <a href="${targetUrl}" class="link">这里</a>
    </div>
  </div>
  <script>
    window.location.href = '${targetUrl}';
  </script>
</body>
</html>`;
}

function generateAllRedirects() {
  REDIRECTS.forEach(({ from, to }) => {
    const targetPath = from === '' 
      ? DEPLOY_TARGET 
      : path.join(DEPLOY_TARGET, from);
    
    const indexPath = path.join(targetPath, 'index.html');
    
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }
    
    fs.writeFileSync(indexPath, generateRedirectHtml(to));
    console.log(`✅ 生成重定向页面: ${from} -> ${to}`);
  });
}

generateAllRedirects();
console.log('\n🎉 所有重定向页面生成完成！');
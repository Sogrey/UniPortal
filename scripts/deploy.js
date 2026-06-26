import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const REPO_NAME = process.env.REPO_NAME || '';
const DEPLOY_TARGET = process.env.DEPLOY_TARGET || path.join(rootDir, 'dist');
const APPS = ['auth-app', 'business-app-a', 'business-app-b'];

const DEPLOY_PATHS = {
  'auth-app': '/auth/',
  'business-app-a': '/app-a/',
  'business-app-b': '/app-b/',
};

function buildApp(appName) {
  const appDir = path.join(rootDir, 'apps', appName);
  console.log(`🔨 构建 ${appName}...`);
  
  try {
    execSync(`pnpm --filter ${appName} build --mode production`, { 
      cwd: rootDir, 
      stdio: 'inherit',
      env: {
        ...process.env,
        REPO_NAME
      }
    });
    console.log(`✅ ${appName} 构建完成`);
  } catch (error) {
    console.error(`❌ ${appName} 构建失败:`, error.message);
    process.exit(1);
  }
}

function copyToDist(appName) {
  const appDir = path.join(rootDir, 'apps', appName);
  const distDir = path.join(appDir, 'dist');
  const deployPath = DEPLOY_PATHS[appName].replace(/^\//, '');
  const targetDir = REPO_NAME 
    ? path.join(DEPLOY_TARGET, REPO_NAME, deployPath)
    : path.join(DEPLOY_TARGET, deployPath);

  if (!fs.existsSync(distDir)) {
    console.error(`❌ ${appName} 构建产物不存在`);
    return false;
  }

  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true });
  }

  fs.mkdirSync(targetDir, { recursive: true });

  console.log(`📦 复制 ${appName} -> ${targetDir}`);
  
  try {
    if (process.platform === 'win32') {
      execSync(`xcopy "${distDir}\\*" "${targetDir}" /E /H /Y /C`, { stdio: 'inherit' });
    } else {
      execSync(`cp -r ${distDir}/* ${targetDir}`, { stdio: 'inherit' });
    }
    console.log(`✅ ${appName} 复制完成`);
    return true;
  } catch (error) {
    console.error(`❌ ${appName} 复制失败:`, error.message);
    return false;
  }
}

function generateCNAME() {
  const CUSTOM_DOMAIN = process.env.CUSTOM_DOMAIN || '';
  if (CUSTOM_DOMAIN) {
    const cnamePath = path.join(DEPLOY_TARGET, 'CNAME');
    fs.writeFileSync(cnamePath, CUSTOM_DOMAIN);
    console.log(`✅ 生成 CNAME 文件 -> ${CUSTOM_DOMAIN}`);
  }
}

function generateRedirects() {
  const rootIndex = path.join(DEPLOY_TARGET, 'index.html');
  const authBasePath = REPO_NAME ? `/${REPO_NAME}/auth/` : '/auth/';
  
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>UniPortal - 统一门户</title>
  <meta http-equiv="refresh" content="0; url=${authBasePath}" />
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
    <div>正在跳转...</div>
    <div style="margin-top: 10px;">
      如果没有自动跳转，请点击 <a href="${authBasePath}" class="link">这里</a>
    </div>
  </div>
  <script>window.location.href = '${authBasePath}';</script>
</body>
</html>`;
  
  fs.writeFileSync(rootIndex, html);
  console.log(`✅ 生成根目录重定向页面 -> ${authBasePath}`);
}

function cleanDist() {
  if (fs.existsSync(DEPLOY_TARGET)) {
    fs.rmSync(DEPLOY_TARGET, { recursive: true });
    console.log('🧹 清理 dist 目录');
  }
  fs.mkdirSync(DEPLOY_TARGET, { recursive: true });
}

const appArg = process.argv[2];
if (appArg && APPS.includes(appArg)) {
  buildApp(appArg);
  copyToDist(appArg);
} else {
  cleanDist();
  APPS.forEach(buildApp);
  APPS.forEach(copyToDist);
  generateCNAME();
  generateRedirects();
  console.log('\n🎉 所有应用部署完成！');
  console.log(`📁 部署目录: ${DEPLOY_TARGET}`);
  console.log(`🔧 REPO_NAME: "${REPO_NAME}"`);
}
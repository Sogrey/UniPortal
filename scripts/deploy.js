import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const DEPLOY_TARGET = process.env.DEPLOY_TARGET || '/var/www/html';
const APPS = ['auth-app', 'business-app-a', 'business-app-b'];

const DEPLOY_PATHS = {
  'auth-app': '/auth/',
  'business-app-a': '/app-a/',
  'business-app-b': '/app-b/',
};

function deployApp(appName) {
  const appDir = path.join(rootDir, 'apps', appName);
  const distDir = path.join(appDir, 'dist');
  const targetDir = path.join(DEPLOY_TARGET, DEPLOY_PATHS[appName] || `/${appName}/`);

  if (!fs.existsSync(distDir)) {
    console.error(`❌ ${appName} 构建产物不存在，请先执行 build`);
    return;
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  console.log(`📦 部署 ${appName} -> ${targetDir}`);
  
  const sourcePath = `${distDir}/*`;
  const targetPath = targetDir.replace(/\/$/, '');
  
  try {
    execSync(`xcopy "${sourcePath}" "${targetPath}" /E /H /Y /C`, { stdio: 'inherit' });
    console.log(`✅ ${appName} 部署完成`);
  } catch (error) {
    console.error(`❌ ${appName} 部署失败:`, error.message);
  }
}

const appArg = process.argv[2];
if (appArg && APPS.includes(appArg)) {
  deployApp(appArg);
} else {
  APPS.forEach(deployApp);
}